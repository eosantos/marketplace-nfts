import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { MutationObserver, QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it } from 'vitest'
import { nftFixtures } from '@/mocks/fixtures'
import { http } from '@/shared/api/http'
import { queryClient as appQueryClient } from '@/shared/api/query-client'
import { qk } from '@/shared/api/query-keys'
import type { AuthResponse, Cart, CartItemInput, Nft } from '@/shared/contracts'
import { dismissCartAlert, pushCartAlert, type CartAlert } from './alerts'
import { getCoupon, setCoupon } from './coupon-store'
import { padEth } from './format'
import {
  addToGuestCart,
  addToGuestItems,
  clearGuestCart,
  getGuestCart,
  GUEST_CART_KEY,
  reloadGuestCart,
  removeGuestItem,
  setGuestItemQuantity,
} from './guest-cart'
import { quoteSignature } from './hooks'
import { planGuestMerge } from './merge'
import { mergeGuestCart } from './merge-guest-cart'
import { removeItemOptions, updateQuantityOptions } from './mutations'

const nft = (id: string): Nft => {
  const found = nftFixtures.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`fixture ${id} não encontrada`)
  return found
}

// nft_002: ABERTA tem 101 disponíveis e limite 5; 1/10 tem 4 e limite 2.
// nft_003: 1/1 tem 1 disponível e limite 1.
const OPEN: CartItemInput = { nftId: 'nft_002', editionType: 'ABERTA', quantity: 2 }

beforeEach(() => {
  clearGuestCart()
  window.sessionStorage.clear()
})

describe('guest cart rules', () => {
  it('sums the same line without duplicating and respects the per-buyer limit', () => {
    const first = addToGuestItems([], nft('nft_002'), OPEN)
    expect(first.ok).toBe(true)
    if (!first.ok) return

    const second = addToGuestItems(first.items, nft('nft_002'), OPEN)
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.items).toHaveLength(1)
    expect(second.items[0].quantity).toBe(4)

    const third = addToGuestItems(second.items, nft('nft_002'), OPEN)
    expect(third.ok).toBe(false)
    if (third.ok) return
    expect(third.message).toContain('máximo de 5')
  })

  it('blocks sold-out editions and lines already at the limit', () => {
    expect(addToGuestItems([], nft('nft_001'), { nftId: 'nft_001', editionType: '1/1', quantity: 1 }).ok).toBe(false)

    const one = addToGuestItems([], nft('nft_003'), { nftId: 'nft_003', editionType: '1/1', quantity: 1 })
    if (!one.ok) throw new Error('esperava sucesso')
    expect(addToGuestItems(one.items, nft('nft_003'), { nftId: 'nft_003', editionType: '1/1', quantity: 1 }).ok).toBe(false)
  })

  it('updates and removes lines by nft + edition', () => {
    const items: CartItemInput[] = [OPEN, { nftId: 'nft_003', editionType: '1/1', quantity: 1 }]
    expect(setGuestItemQuantity(items, 'nft_002', 'ABERTA', 5)[0].quantity).toBe(5)
    expect(removeGuestItem(items, 'nft_002', 'ABERTA')).toEqual([items[1]])
  })

  it('persists in localStorage, restores and ignores corrupt data', () => {
    addToGuestCart(nft('nft_002'), OPEN)
    expect(window.localStorage.getItem(GUEST_CART_KEY)).toContain('nft_002')

    reloadGuestCart()
    expect(getGuestCart()).toEqual([OPEN])

    window.localStorage.setItem(GUEST_CART_KEY, '{quebrado')
    reloadGuestCart()
    expect(getGuestCart()).toEqual([])

    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify([{ nftId: 'x', editionType: '9/99', quantity: -1 }]))
    reloadGuestCart()
    expect(getGuestCart()).toEqual([])
  })
})

describe('planGuestMerge', () => {
  const server: Cart = {
    userId: 'user_alice',
    items: [{ id: 'cart_1', nftId: 'nft_003', editionType: '1/1', quantity: 1 }],
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
  const nfts = new Map([nft('nft_002'), nft('nft_003')].map((item) => [item.id, item] as const))

  it('adds new lines, skips lines already at the limit and clamps to the limit', () => {
    const plan = planGuestMerge(
      [
        OPEN, // novo: entra inteiro
        { nftId: 'nft_003', editionType: '1/1', quantity: 1 }, // já tem 1 e o limite é 1: ignora
        { nftId: 'nft_002', editionType: '1/10', quantity: 5 }, // limite 2: ajusta para 2
        { nftId: 'nao_existe', editionType: '1/1', quantity: 1 }, // NFT inexistente: ignora
      ],
      server,
      nfts,
    )

    expect(plan.toAdd).toEqual([OPEN, { nftId: 'nft_002', editionType: '1/10', quantity: 2 }])
    expect(plan.notes).toHaveLength(3)
  })

  it('subtracts what the account already has', () => {
    const withTwo: Cart = { ...server, items: [{ id: 'cart_2', nftId: 'nft_002', editionType: 'ABERTA', quantity: 4 }] }
    const plan = planGuestMerge([OPEN], withTwo, nfts)
    expect(plan.toAdd).toEqual([{ nftId: 'nft_002', editionType: 'ABERTA', quantity: 1 }])
  })
})

describe('quote signature, money format, coupon and alerts', () => {
  it('ignores line order but not quantity or coupon', () => {
    const a: CartItemInput = { nftId: 'nft_002', editionType: 'ABERTA', quantity: 2 }
    const b: CartItemInput = { nftId: 'nft_003', editionType: '1/1', quantity: 1 }
    expect(quoteSignature([a, b], null)).toBe(quoteSignature([b, a], null))
    expect(quoteSignature([a, b], null)).not.toBe(quoteSignature([{ ...a, quantity: 3 }, b], null))
    expect(quoteSignature([a, b], null)).not.toBe(quoteSignature([a, b], 'KURIO10'))
  })

  it('pads to two decimals without converting to number', () => {
    expect(padEth('0')).toBe('0.00')
    expect(padEth('2.5')).toBe('2.50')
    expect(padEth('26.846')).toBe('26.846')
    expect(padEth('1.19')).toBe('1.19')
  })

  it('keeps the coupon per user', () => {
    setCoupon('user_alice', 'KURIO10')
    expect(getCoupon('user_alice')).toBe('KURIO10')
    expect(getCoupon('user_bob')).toBeNull()
    setCoupon('user_alice', null)
    expect(getCoupon('user_alice')).toBeNull()
  })

  it('pushes alerts without duplicating and dismisses them', () => {
    const client = new QueryClient()
    const alert: CartAlert = { id: 'nft_002-price', message: 'O preço mudou.' }
    pushCartAlert(client, 'user_alice', alert)
    pushCartAlert(client, 'user_alice', alert)
    expect(client.getQueryData<CartAlert[]>(['cart-alerts', 'user_alice'])).toEqual([alert])

    dismissCartAlert(client, 'user_alice', alert.id)
    expect(client.getQueryData<CartAlert[]>(['cart-alerts', 'user_alice'])).toEqual([])
  })
})

// ---- servidor simulado por adapter do Axios ----

const reply = (config: InternalAxiosRequestConfig, status: number, data: unknown): Promise<AxiosResponse> => {
  const response: AxiosResponse = { data, status, statusText: '', headers: {}, config }
  return status >= 400
    ? Promise.reject(new AxiosError('failed', AxiosError.ERR_BAD_RESPONSE, config, null, response))
    : Promise.resolve(response)
}

const cartBody = (items: Cart['items']): Cart => ({
  userId: 'user_alice',
  items,
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('cart mutations (optimistic)', () => {
  const initial: Cart = cartBody([
    { id: 'cart_1', nftId: 'nft_002', editionType: 'ABERTA', quantity: 1 },
    { id: 'cart_2', nftId: 'nft_003', editionType: '1/1', quantity: 1 },
  ])

  function setup() {
    const client = new QueryClient()
    client.setQueryData(qk.cart('user_alice'), initial)
    return client
  }

  it('shows the new quantity at once and rolls back with the server reason on failure', async () => {
    const client = setup()
    http.defaults.adapter = (config) =>
      wait(15).then(() => reply(config, 409, { code: 'AVAILABILITY_CONFLICT', message: 'Limite atingido.' }))

    const observer = new MutationObserver(client, updateQuantityOptions(client, 'user_alice'))
    const done = observer.mutate({ itemId: 'cart_1', quantity: 5 }).catch(() => 'failed')

    await wait(5)
    expect(client.getQueryData<Cart>(qk.cart('user_alice'))?.items[0].quantity).toBe(5)

    expect(await done).toBe('failed')
    expect(client.getQueryData<Cart>(qk.cart('user_alice'))).toEqual(initial)
  })

  it('removes optimistically and restores the line when the server fails', async () => {
    const client = setup()
    http.defaults.adapter = (config) => wait(15).then(() => reply(config, 503, { code: 'TRANSIENT', message: 'Fora do ar.' }))

    const observer = new MutationObserver(client, removeItemOptions(client, 'user_alice'))
    const done = observer.mutate({ itemId: 'cart_2' }).catch(() => 'failed')

    await wait(5)
    expect(client.getQueryData<Cart>(qk.cart('user_alice'))?.items.map((item) => item.id)).toEqual(['cart_1'])

    await done
    expect(client.getQueryData<Cart>(qk.cart('user_alice'))).toEqual(initial)
  })

  it('reconciles with the server only once when taps overlap (no flicker)', async () => {
    const client = setup()
    let invalidations = 0
    const original = client.invalidateQueries.bind(client)
    client.invalidateQueries = (...args) => {
      invalidations += 1
      return original(...args)
    }

    let delays = [10, 30]
    http.defaults.adapter = (config) =>
      wait(delays.shift() ?? 10).then(() => reply(config, 200, cartBody([{ id: 'cart_1', nftId: 'nft_002', editionType: 'ABERTA', quantity: 3 }])))

    const first = new MutationObserver(client, updateQuantityOptions(client, 'user_alice'))
    const second = new MutationObserver(client, updateQuantityOptions(client, 'user_alice'))
    const a = first.mutate({ itemId: 'cart_1', quantity: 2 })
    await wait(1)
    const b = second.mutate({ itemId: 'cart_1', quantity: 3 })

    await wait(5)
    expect(client.getQueryData<Cart>(qk.cart('user_alice'))?.items[0].quantity).toBe(3)

    await Promise.all([a, b])
    expect(invalidations).toBe(1)
    delays = []
  })
})

describe('mergeGuestCart (end to end with a simulated server)', () => {
  const auth: AuthResponse = {
    user: {
      id: 'user_alice',
      email: 'alice@nft.test',
      displayName: 'Alice',
      userName: 'alice',
      profileName: 'Alice',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    session: { id: 's1', userId: 'user_alice', token: 'tok', expiresAt: '2026-12-01T12:00:00.000Z' },
  }

  it('adds guest items to the account cart within limits, then clears the guest cart', async () => {
    const serverItems: Cart['items'] = [{ id: 'cart_1', nftId: 'nft_003', editionType: '1/1', quantity: 1 }]
    const calls: string[] = []

    http.defaults.adapter = (config) => {
      const url = config.url ?? ''
      const method = (config.method ?? 'get').toLowerCase()
      calls.push(`${method.toUpperCase()} ${url}`)

      if (url === '/cart' && method === 'get') return reply(config, 200, cartBody(serverItems))
      if (url === '/cart/items' && method === 'post') {
        const body = JSON.parse(String(config.data)) as CartItemInput
        const existing = serverItems.find((item) => item.nftId === body.nftId && item.editionType === body.editionType)
        if (existing) existing.quantity += body.quantity
        else serverItems.push({ id: `cart_${serverItems.length + 1}`, ...body })
        return reply(config, 200, cartBody(serverItems))
      }
      const match = /^\/nfts\/(.+)$/.exec(url)
      const found = match ? nftFixtures.find((candidate) => candidate.id === decodeURIComponent(match[1])) : undefined
      if (found) return reply(config, 200, found)
      return reply(config, 404, { code: 'NOT_FOUND', message: 'não encontrado' })
    }

    // Visitante: 2 unidades da edição aberta e a 1/1 que a conta já possui.
    addToGuestCart(nft('nft_002'), OPEN)
    addToGuestCart(nft('nft_003'), { nftId: 'nft_003', editionType: '1/1', quantity: 1 })

    await mergeGuestCart(auth)

    expect(getGuestCart()).toEqual([])
    expect(serverItems.map((item) => `${item.nftId}|${item.editionType}|${item.quantity}`)).toEqual([
      'nft_003|1/1|1',
      'nft_002|ABERTA|2',
    ])
    // Só o item que cabia no limite foi enviado (a 1/1 já estava no limite).
    expect(calls.filter((call) => call === 'POST /cart/items')).toHaveLength(1)
    expect(appQueryClient.getQueryData<Cart>(qk.cart('user_alice'))?.items).toHaveLength(2)
  })

  it('keeps the guest cart when the server fails', async () => {
    http.defaults.adapter = (config) => reply(config, 503, { code: 'TRANSIENT', message: 'Fora do ar.' })
    addToGuestCart(nft('nft_002'), OPEN)

    await mergeGuestCart(auth)
    expect(getGuestCart()).toEqual([OPEN])
  })
})
