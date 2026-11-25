import { Decimal } from 'decimal.js'
import {
  OrderCreateInputSchema,
  type NftNetwork,
  type Order,
  type OrderItemSnapshot,
  type OrderSnapshot,
} from '@/shared/contracts'
import { getActiveScenario, getDb, mutateDb } from '../db'
import { nextSequence } from '../db/sequences'
import type { MockDb } from '../db/types'
import { emitMockDbEvent } from '../events'
import { fail, ok, validationFail, type ServiceResult } from '../http/result'
import { hashString } from '../util/prng'
import { stableStringify } from '../util/stable'
import { checkCapacity } from './capacity'

/** Tempo até o pedido pendente ser liquidado (confirmado ou recusado). */
export const ORDER_SETTLE_DELAY_MS = 2500
/** No cenário timeout-after-order-created a resposta da criação nunca chega ao cliente. */
export const ORDER_TIMEOUT_SIMULATION_MS = 20_000

const PRICE_BUMP = '0.10'

const EXPLORERS: Record<NftNetwork, string> = {
  Ethereum: 'https://etherscan.io/tx/',
  Polygon: 'https://polygonscan.com/tx/',
  Solana: 'https://solscan.io/tx/',
}

export interface CreateOrderOutput {
  order: Order
  /** `false` quando a mesma Idempotency-Key devolveu o pedido já existente. */
  created: boolean
  /** Cenário timeout-after-order-created: o pedido existe, mas a resposta deve se perder. */
  dropResponse: boolean
}

function hasFlag(db: MockDb, name: string): boolean {
  return db.scenarioFlags?.[name] === true
}

function setFlag(db: MockDb, name: string): void {
  db.scenarioFlags = { ...(db.scenarioFlags ?? {}), [name]: true }
}

/** Hash de transação simulado (0x + 64 hex), determinístico por pedido. */
function fakeTxHash(seed: string): string {
  let hex = ''
  for (let index = 0; index < 8; index += 1) {
    hex += hashString(`${seed}:${index}`).toString(16).padStart(8, '0')
  }
  return `0x${hex}`
}

/**
 * Cria um pedido `pending` a partir de uma cotação válida.
 * Mesma Idempotency-Key + mesmo corpo devolve o mesmo pedido; corpo diferente dá IDEMPOTENCY_CONFLICT.
 */
export function createOrder(
  userId: string,
  idempotencyKey: string | null,
  input: unknown,
): ServiceResult<CreateOrderOutput> {
  const key = idempotencyKey?.trim()
  if (!key) {
    return fail('VALIDATION_ERROR', 'Verifique os campos informados.', [
      { field: 'Idempotency-Key', message: 'Header obrigatório.' },
    ])
  }

  const parsed = OrderCreateInputSchema.safeParse(input)
  if (!parsed.success) return validationFail(parsed.error)

  const data = parsed.data
  const requestHash = stableStringify(data)
  const recordKey = `${userId}:${key}`

  return mutateDb((db): ServiceResult<CreateOrderOutput> => {
    // 1) Idempotência primeiro: o reenvio nunca cria outro pedido.
    const existing = db.idempotency[recordKey]
    if (existing) {
      if (existing.requestHash !== requestHash) {
        return fail('IDEMPOTENCY_CONFLICT', 'Esta chave de idempotência já foi usada com outro corpo.')
      }
      const previous = db.orders.find((order) => order.id === existing.orderId)
      if (previous) return ok({ order: structuredClone(previous), created: false, dropResponse: false })
    }

    // 2) Carteira e cotação.
    const wallet = db.wallets.find((candidate) => candidate.id === data.walletId)
    if (!wallet) return fail('NOT_FOUND', 'Carteira não encontrada.')
    if (wallet.userId !== userId) return fail('FORBIDDEN', 'Esta carteira pertence a outro usuário.')

    const quote = db.quotes.find(
      (candidate) => candidate.quoteId === data.quoteId && candidate.userId === userId,
    )
    if (!quote) return fail('NOT_FOUND', 'Cotação não encontrada.')
    if (quote.version !== data.quoteVersion) {
      return fail('PRICE_CHANGED', 'Cotação desatualizada. Gere uma nova cotação.')
    }
    if (Date.now() > new Date(quote.expiresAt).getTime()) {
      return fail('PRICE_CHANGED', 'Cotação expirada. Gere uma nova cotação.')
    }

    const scenario = getActiveScenario()
    const now = new Date().toISOString()

    // 3) Cenários de eventos únicos: acontecem na primeira tentativa e persistem no banco.
    if (scenario === 'price-changed-at-checkout' && !hasFlag(db, 'priceChangedAtCheckout')) {
      for (const item of quote.items) {
        const nft = db.nfts.find((candidate) => candidate.id === item.nftId)
        if (!nft) continue
        nft.price = new Decimal(nft.price).plus(PRICE_BUMP).toFixed()
        nft.updatedAt = now
        emitMockDbEvent({ type: 'nft.updated', nftId: nft.id })
      }
      setFlag(db, 'priceChangedAtCheckout')
      return fail('PRICE_CHANGED', 'O preço mudou desde a cotação. Revise e confirme novamente.')
    }

    if (scenario === 'sold-out-at-checkout' && !hasFlag(db, 'soldOutAtCheckout')) {
      const first = quote.items[0]
      const edition = db.nfts
        .find((candidate) => candidate.id === first.nftId)
        ?.editions.find((candidate) => candidate.type === first.editionType)
      if (edition) {
        edition.available = 0
        emitMockDbEvent({ type: 'nft.updated', nftId: first.nftId })
      }
      setFlag(db, 'soldOutAtCheckout')
      return fail('AVAILABILITY_CONFLICT', 'Um item esgotou durante o checkout.')
    }

    // 4) Revalida preço e estoque contra o estado atual.
    const items: OrderItemSnapshot[] = []
    for (const item of quote.items) {
      const nft = db.nfts.find((candidate) => candidate.id === item.nftId)
      if (!nft) return fail('NOT_FOUND', 'NFT não encontrado.')
      if (!new Decimal(nft.price).eq(item.unitPrice)) {
        return fail('PRICE_CHANGED', `O preço de ${nft.name} mudou desde a cotação.`)
      }

      const capacity = checkCapacity(db, item.nftId, item.editionType, item.quantity)
      if (!capacity.ok) return capacity

      items.push({
        nftId: nft.id,
        nftName: nft.name,
        nftImage: nft.image,
        tokenId: nft.tokenId,
        collection: nft.collection,
        editionType: item.editionType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })
    }

    // 5) Cria o pedido com snapshot imutável.
    const snapshot: OrderSnapshot = {
      quoteId: quote.quoteId,
      quoteVersion: quote.version,
      collector: {
        displayName: data.collector.displayName,
        userName: data.collector.userName,
        profileName: data.collector.profileName,
        email: data.collector.email,
        walletId: wallet.id,
        walletNickname: wallet.nickname,
        walletType: wallet.type,
        walletAddress: wallet.address,
        ...(wallet.ensName ? { ensName: wallet.ensName } : {}),
        network: data.network,
      },
      items,
      subtotal: quote.subtotal,
      discount: quote.discount,
      networkFee: quote.networkFee,
      total: quote.total,
      ...(quote.coupon ? { coupon: quote.coupon } : {}),
      couponStatus: quote.couponStatus,
      ...(data.note ? { note: data.note } : {}),
      ...(data.referralCode ? { referralCode: data.referralCode } : {}),
      placedAt: now,
    }

    const order: Order = {
      id: `order_${nextSequence(db, 'order')}`,
      userId,
      status: 'pending',
      walletId: wallet.id,
      network: data.network,
      snapshot,
      createdAt: now,
      updatedAt: now,
    }

    db.orders.push(order)
    db.idempotency[recordKey] = { orderId: order.id, requestHash, createdAt: now }
    db.orderSettlements = {
      ...(db.orderSettlements ?? {}),
      [order.id]: {
        at: Date.now() + ORDER_SETTLE_DELAY_MS,
        outcome: scenario === 'payment-refused' ? 'refused' : 'confirmed',
      },
    }

    emitMockDbEvent({ type: 'order.updated', orderId: order.id, userId, status: 'pending' })

    return ok({
      order: structuredClone(order),
      created: true,
      dropResponse: scenario === 'timeout-after-order-created',
    })
  })
}

/** Na confirmação: baixa o estoque e remove do carrinho só o que foi comprado. */
function applyConfirmedPurchase(db: MockDb, order: Order, now: string): void {
  const cart = db.carts.find((candidate) => candidate.userId === order.userId)

  for (const item of order.snapshot.items) {
    const nft = db.nfts.find((candidate) => candidate.id === item.nftId)
    const edition = nft?.editions.find((candidate) => candidate.type === item.editionType)
    if (nft && edition) {
      edition.available = Math.max(0, edition.available - item.quantity)
      nft.updatedAt = now
      emitMockDbEvent({ type: 'nft.updated', nftId: nft.id })
    }

    const line = cart?.items.find(
      (candidate) => candidate.nftId === item.nftId && candidate.editionType === item.editionType,
    )
    if (cart && line) {
      line.quantity -= item.quantity
      if (line.quantity <= 0) cart.items = cart.items.filter((candidate) => candidate.id !== line.id)
      cart.updatedAt = now
    }
  }
}

/**
 * Liquida um pedido pendente. Estados terminais nunca regridem:
 * chamar de novo num pedido confirmado/recusado devolve o pedido como está.
 */
export function settleOrder(orderId: string): ServiceResult<Order> {
  return mutateDb((db): ServiceResult<Order> => {
    const order = db.orders.find((candidate) => candidate.id === orderId)
    if (!order) return fail('NOT_FOUND', 'Pedido não encontrado.')
    if (order.status !== 'pending') return ok(structuredClone(order))

    const outcome = db.orderSettlements?.[orderId]?.outcome ?? 'confirmed'
    const now = new Date().toISOString()

    if (outcome === 'confirmed') {
      const txRef = fakeTxHash(order.id)
      order.status = 'confirmed'
      order.txRef = txRef
      order.txExplorerUrl = `${EXPLORERS[order.network]}${txRef}`
      applyConfirmedPurchase(db, order, now)
    } else {
      order.status = 'refused'
    }
    order.updatedAt = now

    emitMockDbEvent({
      type: 'order.updated',
      orderId: order.id,
      userId: order.userId,
      status: order.status,
    })
    return ok(structuredClone(order))
  })
}

/** Agenda a liquidação (o timer é só conveniência; getOrder também liquida pedidos vencidos). */
export function scheduleOrderSettlement(
  orderId: string,
  delayMs: number = ORDER_SETTLE_DELAY_MS,
): void {
  setTimeout(() => {
    settleOrder(orderId)
  }, delayMs)
}

/** Consulta o pedido/recibo. Liquida de forma preguiçosa se o prazo já venceu (refresh, aba fechada). */
export function getOrder(userId: string, orderId: string): ServiceResult<Order> {
  const db = getDb()
  const order = db.orders.find((candidate) => candidate.id === orderId)
  if (!order) return fail('NOT_FOUND', 'Pedido não encontrado.')
  if (order.userId !== userId) return fail('FORBIDDEN', 'Este pedido pertence a outro usuário.')

  if (order.status === 'pending') {
    const settlement = db.orderSettlements?.[orderId]
    if (settlement && Date.now() >= settlement.at) return settleOrder(orderId)
  }
  return ok(structuredClone(order))
}
