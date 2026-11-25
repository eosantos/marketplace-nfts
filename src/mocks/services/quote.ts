import { Decimal } from 'decimal.js'
import {
  QuoteRequestSchema,
  type CouponStatus,
  type NftEditionType,
  type Quote,
  type QuoteItem,
} from '@/shared/contracts'
import { mutateDb } from '../db'
import { nextSequence } from '../db/sequences'
import type { MockDb, MockQuote } from '../db/types'
import { fail, ok, validationFail, type ServiceResult } from '../http/result'
import { couponScenarioStatus } from '../scenarios/latency'
import { checkCapacity } from './capacity'

/** Taxa de rede estimada, fixa por pedido (aparece como "Taxa estimada" no Figma). */
export const NETWORK_FEE = '0.016'
export const QUOTE_TTL_MS = 10 * 60 * 1000
const MAX_QUOTES_PER_USER = 20
const DISCOUNT_DECIMALS = 6

function couponError(code: 'COUPON_INVALID' | 'COUPON_EXPIRED'): ServiceResult<never> {
  const message = code === 'COUPON_INVALID' ? 'Cupom inválido.' : 'Cupom expirado.'
  return fail(code, message, [{ field: 'coupon', message }])
}

/**
 * Resolve o desconto do cupom sobre o subtotal.
 * A validade usa só o `status` do cupom (não a data), para a demonstração não expirar com o calendário.
 */
function resolveCoupon(db: MockDb, code: string, subtotal: Decimal): ServiceResult<Decimal> {
  const forced = couponScenarioStatus()
  if (forced === 'invalid') return couponError('COUPON_INVALID')
  if (forced === 'expired') return couponError('COUPON_EXPIRED')

  const coupon = db.coupons.find((candidate) => candidate.code.toLowerCase() === code.toLowerCase())
  if (!coupon || coupon.status === 'invalid') return couponError('COUPON_INVALID')
  if (coupon.status === 'expired') return couponError('COUPON_EXPIRED')

  const raw =
    coupon.kind === 'percent'
      ? subtotal.times(coupon.value).div(100)
      : new Decimal(coupon.value)

  return ok(Decimal.min(raw, subtotal).toDecimalPlaces(DISCOUNT_DECIMALS, Decimal.ROUND_HALF_UP))
}

function toQuote(record: MockQuote): Quote {
  return {
    quoteId: record.quoteId,
    version: record.version,
    items: record.items,
    subtotal: record.subtotal,
    discount: record.discount,
    networkFee: record.networkFee,
    total: record.total,
    ...(record.coupon ? { coupon: record.coupon } : {}),
    couponStatus: record.couponStatus,
    expiresAt: record.expiresAt,
  }
}

/**
 * Calcula subtotal, desconto, taxa e total com decimal.js e valida disponibilidade.
 * Cada cotação recebe `quoteId` e `version` incrementais.
 */
export function createQuote(userId: string, input: unknown): ServiceResult<Quote> {
  const parsed = QuoteRequestSchema.safeParse(input)
  if (!parsed.success) return validationFail(parsed.error)

  const { items, coupon } = parsed.data

  return mutateDb((db): ServiceResult<Quote> => {
    // Linhas repetidas (mesmo NFT + edição) são somadas antes de validar o estoque.
    const lines = new Map<string, { nftId: string; editionType: NftEditionType; quantity: number }>()
    for (const item of items) {
      const key = `${item.nftId}|${item.editionType}`
      const current = lines.get(key)
      if (current) current.quantity += item.quantity
      else lines.set(key, { nftId: item.nftId, editionType: item.editionType, quantity: item.quantity })
    }

    const quoteItems: QuoteItem[] = []
    for (const line of lines.values()) {
      const capacity = checkCapacity(db, line.nftId, line.editionType, line.quantity)
      if (!capacity.ok) return capacity

      const nft = db.nfts.find((candidate) => candidate.id === line.nftId)
      if (!nft) return fail('NOT_FOUND', 'NFT não encontrado.')

      quoteItems.push({
        nftId: nft.id,
        nftName: nft.name,
        nftImage: nft.image,
        editionType: line.editionType,
        quantity: line.quantity,
        unitPrice: nft.price,
        subtotal: new Decimal(nft.price).times(line.quantity).toFixed(),
      })
    }

    const subtotal = quoteItems.reduce((sum, item) => sum.plus(item.subtotal), new Decimal(0))

    const code = coupon?.trim()
    let discount = new Decimal(0)
    let couponStatus: CouponStatus = 'not_applied'
    if (code) {
      const resolved = resolveCoupon(db, code, subtotal)
      if (!resolved.ok) return resolved
      discount = resolved.data
      couponStatus = 'valid'
    }

    const total = subtotal.minus(discount).plus(NETWORK_FEE)
    const sequence = nextSequence(db, 'quote')
    const now = new Date()

    const record: MockQuote = {
      quoteId: `quote_${sequence}`,
      version: sequence,
      items: quoteItems,
      subtotal: subtotal.toFixed(),
      discount: discount.toFixed(),
      networkFee: NETWORK_FEE,
      total: total.toFixed(),
      ...(code && couponStatus === 'valid' ? { coupon: code } : {}),
      couponStatus,
      expiresAt: new Date(now.getTime() + QUOTE_TTL_MS).toISOString(),
      userId,
      createdAt: now.toISOString(),
    }
    db.quotes.push(record)

    // Mantém só as cotações mais recentes de cada usuário (localStorage tem cota).
    const mine = db.quotes.filter((quote) => quote.userId === userId)
    if (mine.length > MAX_QUOTES_PER_USER) {
      const drop = new Set(mine.slice(0, mine.length - MAX_QUOTES_PER_USER).map((quote) => quote.quoteId))
      db.quotes = db.quotes.filter((quote) => !drop.has(quote.quoteId))
    }

    return ok(toQuote(record))
  })
}
