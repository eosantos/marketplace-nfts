import { Decimal } from 'decimal.js'
import type { QueryClient } from '@tanstack/react-query'
import { clearCartAlerts, pushCartAlert } from '@/features/cart/alerts'
import { maxQuantity } from '@/features/nft/editions'
import { qk } from '@/shared/api/query-keys'
import {
  NftUpdatedPayloadSchema,
  OrderUpdatedPayloadSchema,
  type Cart,
  type Nft,
  type NftListResponse,
  type NftUpdatedPayload,
  type Order,
  type Quote,
  type SocketEvent,
} from '@/shared/contracts'
import { announce } from './announcer'

export interface RealtimeContext {
  queryClient: QueryClient
  userId: string
}

/** Último preço unitário que o carrinho conhecia (das cotações em cache), para detectar mudança. */
function quotedPrice(queryClient: QueryClient, userId: string, nftId: string): string | undefined {
  for (const [, quote] of queryClient.getQueriesData<Quote>({ queryKey: ['quote', userId] })) {
    const item = quote?.items.find((candidate) => candidate.nftId === nftId)
    if (item) return item.unitPrice
  }
  return undefined
}

/** Mensagens para o carrinho: preço que mudou e linhas que deixaram de ser atendíveis. */
export function describeNftChange(
  previousPrice: string | undefined,
  payload: NftUpdatedPayload,
  cart: Cart | undefined,
): string[] {
  const lines = cart?.items.filter((item) => item.nftId === payload.id) ?? []
  if (lines.length === 0) return []

  const messages: string[] = []

  if (previousPrice !== undefined && !new Decimal(previousPrice).eq(payload.price)) {
    messages.push(`${payload.name}: o preço mudou de ${previousPrice} para ${payload.price} ETH.`)
  }

  for (const line of lines) {
    const max = maxQuantity(payload.editions.find((edition) => edition.type === line.editionType))
    if (max === 0) {
      messages.push(`${payload.name} (${line.editionType}) esgotou.`)
    } else if (line.quantity > max) {
      messages.push(
        `${payload.name} (${line.editionType}): agora você pode levar no máximo ${max} unidade${max === 1 ? '' : 's'}.`,
      )
    }
  }

  return messages
}

function patchNft(nft: Nft, payload: NftUpdatedPayload): Nft {
  const next: Nft = { ...nft, price: payload.price, editions: payload.editions, updatedAt: payload.updatedAt }
  if (payload.oldPrice) next.oldPrice = payload.oldPrice
  else delete next.oldPrice
  return next
}

function applyNftUpdated({ queryClient, userId }: RealtimeContext, event: SocketEvent): void {
  const parsed = NftUpdatedPayloadSchema.safeParse(event.payload)
  if (!parsed.success) return
  const payload = parsed.data

  const cart = queryClient.getQueryData<Cart>(qk.cart(userId))
  const previousPrice = queryClient.getQueryData<Nft>(qk.nft(payload.id))?.price ?? quotedPrice(queryClient, userId, payload.id)

  // Detalhe, listas (catálogo, relacionados, sugestões, destaque) e favoritos mostram o novo estado.
  queryClient.setQueryData<Nft>(qk.nft(payload.id), (old) => (old ? patchNft(old, payload) : old))
  queryClient.setQueriesData<NftListResponse>({ queryKey: ['nfts', 'list'] }, (old) =>
    old
      ? { ...old, items: old.items.map((item) => (item.id === payload.id ? patchNft(item, payload) : item)) }
      : old,
  )
  queryClient.setQueryData<Nft[]>(qk.favorites(userId), (old) =>
    old?.map((item) => (item.id === payload.id ? patchNft(item, payload) : item)),
  )
  // Filtros e ordenação por preço podem ter mudado: a lista é refeita na próxima visita.
  void queryClient.invalidateQueries({ queryKey: ['nfts', 'list'], refetchType: 'none' })

  if (cart?.items.some((item) => item.nftId === payload.id)) {
    // O resumo do carrinho é uma cotação do servidor: refazê-la atualiza os totais.
    void queryClient.invalidateQueries({ queryKey: ['quote', userId] })

    const messages = describeNftChange(previousPrice, payload, cart)
    messages.forEach((message, index) => {
      pushCartAlert(queryClient, userId, { id: `${event.id}-${index}`, message })
    })
    if (messages.length > 0) announce(messages.join(' '))
  }
}

const ORDER_MESSAGES = {
  confirmed: 'Pedido confirmado.',
  refused: 'Pagamento recusado.',
  pending: 'Pedido em processamento.',
} as const

function applyOrderUpdated({ queryClient, userId }: RealtimeContext, event: SocketEvent): void {
  const parsed = OrderUpdatedPayloadSchema.safeParse(event.payload)
  if (!parsed.success) return
  const payload = parsed.data

  const key = qk.order(userId, payload.orderId)
  queryClient.setQueryData<Order>(key, (old) => {
    // Estados terminais nunca regridem, mesmo que um evento atrasado diga o contrário.
    if (!old || old.status !== 'pending') return old
    return {
      ...old,
      status: payload.status,
      ...(payload.txRef ? { txRef: payload.txRef } : {}),
      ...(payload.txExplorerUrl ? { txExplorerUrl: payload.txExplorerUrl } : {}),
      updatedAt: payload.updatedAt,
    }
  })
  // O recibo completo (snapshot) vem do REST.
  void queryClient.invalidateQueries({ queryKey: key })

  if (payload.status !== 'pending') {
    // A compra mudou o carrinho e o estoque no servidor; avisos antigos do carrinho perderam o sentido.
    clearCartAlerts(queryClient, userId)
    void queryClient.invalidateQueries({ queryKey: qk.cart(userId) })
    void queryClient.invalidateQueries({ queryKey: ['quote', userId] })
  }
  announce(ORDER_MESSAGES[payload.status])
}

/** Aplica um evento JÁ aceito pelo ledger (nunca chame direto com dados não validados). */
export function applyRealtimeEvent(context: RealtimeContext, event: SocketEvent): void {
  if (event.type === 'nft.updated') applyNftUpdated(context, event)
  else applyOrderUpdated(context, event)
}
