import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it } from 'vitest'
import type { CartAlert } from '@/features/cart/alerts'
import { nftFixtures } from '@/mocks/fixtures'
import { qk } from '@/shared/api/query-keys'
import type {
  Cart,
  Nft,
  NftListResponse,
  NftUpdatedPayload,
  Order,
  OrderUpdatedPayload,
  SocketEvent,
} from '@/shared/contracts'
import { applyRealtimeEvent, describeNftChange } from './apply-event'

const USER = 'user_alice'
const base = nftFixtures[1] // nft_002

const nftEvent = (payload: NftUpdatedPayload, id = 'evt_1', version = 1): SocketEvent => ({
  id,
  type: 'nft.updated',
  resource: 'nft',
  resourceId: payload.id,
  version,
  payload,
})

const payloadFor = (changes: Partial<NftUpdatedPayload> = {}): NftUpdatedPayload => ({
  id: base.id,
  name: base.name,
  price: base.price,
  editions: structuredClone(base.editions),
  updatedAt: '2026-11-25T12:00:00.000Z',
  ...changes,
})

const withOpenAvailable = (available: number) =>
  base.editions.map((edition) => (edition.type === 'ABERTA' ? { ...edition, available } : edition))

const cartWith = (quantity: number): Cart => ({
  userId: USER,
  items: [{ id: 'cart_1', nftId: base.id, editionType: 'ABERTA', quantity }],
  updatedAt: '2026-01-01T00:00:00.000Z',
})

function setup() {
  const queryClient = new QueryClient()
  const invalidated: string[] = []
  const original = queryClient.invalidateQueries.bind(queryClient)
  queryClient.invalidateQueries = (filters, options) => {
    invalidated.push(JSON.stringify(filters?.queryKey))
    return original(filters, options)
  }
  return { queryClient, invalidated }
}

const alertsOf = (client: QueryClient) => client.getQueryData<CartAlert[]>(['cart-alerts', USER]) ?? []

describe('nft.updated', () => {
  let ctx: ReturnType<typeof setup>

  beforeEach(() => {
    ctx = setup()
  })

  it('patches the detail, every cached list and the favorites', () => {
    const { queryClient } = ctx
    const list: NftListResponse = { items: [base, nftFixtures[2]], page: 1, pageSize: 9, total: 2 }
    queryClient.setQueryData(qk.nft(base.id), base)
    queryClient.setQueryData(qk.nfts({ page: '1' }), list)
    queryClient.setQueryData(qk.favorites(USER), [base])

    applyRealtimeEvent(
      { queryClient, userId: USER },
      nftEvent(payloadFor({ price: '9.99', editions: withOpenAvailable(0) })),
    )

    expect(queryClient.getQueryData<Nft>(qk.nft(base.id))?.price).toBe('9.99')
    const patchedList = queryClient.getQueryData<NftListResponse>(qk.nfts({ page: '1' }))
    expect(patchedList?.items[0].price).toBe('9.99')
    expect(patchedList?.items[0].editions.find((edition) => edition.type === 'ABERTA')?.available).toBe(0)
    expect(patchedList?.items[1]).toEqual(nftFixtures[2])
    expect(queryClient.getQueryData<Nft[]>(qk.favorites(USER))?.[0].price).toBe('9.99')
  })

  it('removes a stale discount price when the event no longer carries one', () => {
    const { queryClient } = ctx
    queryClient.setQueryData(qk.nft(base.id), { ...base, oldPrice: '5.00' })
    applyRealtimeEvent({ queryClient, userId: USER }, nftEvent(payloadFor()))
    expect(queryClient.getQueryData<Nft>(qk.nft(base.id))?.oldPrice).toBeUndefined()
  })

  it('warns about a price change for an item in the cart and refreshes the quote', () => {
    const { queryClient, invalidated } = ctx
    queryClient.setQueryData(qk.cart(USER), cartWith(2))
    queryClient.setQueryData(qk.nft(base.id), base)

    applyRealtimeEvent({ queryClient, userId: USER }, nftEvent(payloadFor({ price: '1.50' })))

    expect(alertsOf(queryClient)).toHaveLength(1)
    expect(alertsOf(queryClient)[0].message).toContain(`de ${base.price} para 1.50 ETH`)
    expect(invalidated).toContain(JSON.stringify(['quote', USER]))
  })

  it('learns the previous price from the cached quote when the detail is not cached', () => {
    const { queryClient } = ctx
    queryClient.setQueryData(qk.cart(USER), cartWith(1))
    queryClient.setQueryData(qk.quote(USER, 'sig'), { items: [{ nftId: base.id, unitPrice: '0.09' }] })

    applyRealtimeEvent({ queryClient, userId: USER }, nftEvent(payloadFor({ price: '0.19' })))
    expect(alertsOf(queryClient)[0].message).toContain('de 0.09 para 0.19 ETH')
  })

  it('warns when the cart line can no longer be fulfilled', () => {
    const { queryClient } = ctx
    queryClient.setQueryData(qk.cart(USER), cartWith(4))

    applyRealtimeEvent({ queryClient, userId: USER }, nftEvent(payloadFor({ editions: withOpenAvailable(2) })))
    expect(alertsOf(queryClient)[0].message).toContain('no máximo 2 unidades')

    applyRealtimeEvent({ queryClient, userId: USER }, nftEvent(payloadFor({ editions: withOpenAvailable(0) }), 'evt_2', 2))
    expect(alertsOf(queryClient).some((alert) => alert.message.includes('esgotou'))).toBe(true)
  })

  it('does not touch the cart or the quote for an nft that is not in it', () => {
    const { queryClient, invalidated } = ctx
    queryClient.setQueryData(qk.cart(USER), { ...cartWith(1), items: [] })
    applyRealtimeEvent({ queryClient, userId: USER }, nftEvent(payloadFor({ price: '3.00' })))
    expect(alertsOf(queryClient)).toHaveLength(0)
    expect(invalidated).not.toContain(JSON.stringify(['quote', USER]))
  })

  it('ignores a malformed payload', () => {
    const { queryClient } = ctx
    queryClient.setQueryData(qk.nft(base.id), base)
    applyRealtimeEvent({ queryClient, userId: USER }, { ...nftEvent(payloadFor()), payload: { id: base.id, price: 'abc' } })
    expect(queryClient.getQueryData<Nft>(qk.nft(base.id))).toEqual(base)
  })
})

describe('describeNftChange', () => {
  it('is empty when the cart does not hold the nft', () => {
    expect(describeNftChange('0.09', payloadFor({ price: '1.00' }), undefined)).toEqual([])
  })
})

describe('order.updated', () => {
  const order = (status: Order['status']): Order =>
    ({
      id: 'order_1',
      userId: USER,
      status,
      walletId: 'wallet_alice_primary',
      network: 'Ethereum',
      snapshot: {},
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }) as unknown as Order

  const orderEvent = (payload: OrderUpdatedPayload, id: string, version: number): SocketEvent => ({
    id,
    type: 'order.updated',
    resource: 'order',
    resourceId: payload.orderId,
    version,
    userId: USER,
    payload,
  })

  it('moves a pending order forward, refreshes cart and quote, and clears stale cart alerts', () => {
    const { queryClient, invalidated } = setup()
    queryClient.setQueryData(qk.order(USER, 'order_1'), order('pending'))
    queryClient.setQueryData<CartAlert[]>(['cart-alerts', USER], [{ id: 'a', message: 'x' }])

    applyRealtimeEvent(
      { queryClient, userId: USER },
      orderEvent(
        { orderId: 'order_1', status: 'confirmed', txRef: `0x${'b'.repeat(64)}`, updatedAt: '2026-11-25T12:00:00.000Z' },
        'evt_1',
        2,
      ),
    )

    const cached = queryClient.getQueryData<Order>(qk.order(USER, 'order_1'))
    expect(cached?.status).toBe('confirmed')
    expect(cached?.txRef).toBe(`0x${'b'.repeat(64)}`)
    expect(alertsOf(queryClient)).toEqual([])
    expect(invalidated).toContain(JSON.stringify(qk.cart(USER)))
    expect(invalidated).toContain(JSON.stringify(['quote', USER]))
  })

  it('never regresses a terminal order in the cache', () => {
    const { queryClient } = setup()
    queryClient.setQueryData(qk.order(USER, 'order_1'), order('confirmed'))
    applyRealtimeEvent(
      { queryClient, userId: USER },
      orderEvent({ orderId: 'order_1', status: 'pending', updatedAt: '2026-11-25T12:00:00.000Z' }, 'evt_9', 1),
    )
    expect(queryClient.getQueryData<Order>(qk.order(USER, 'order_1'))?.status).toBe('confirmed')
  })
})
