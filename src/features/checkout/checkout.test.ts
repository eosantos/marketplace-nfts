import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Order, OrderCreateInput, Quote } from '@/shared/contracts'
import {
  clearCheckoutState,
  loadCheckoutState,
  newIdempotencyKey,
  saveAttempt,
  saveDraft,
  type CheckoutAttempt,
  type CheckoutDraft,
} from './checkout-store'
import { checkoutFormSchema, newWalletFormSchema } from './form-schema'
import { diffQuotes } from './quote-diff'
import { isRetryable, submitOrder, type SubmitDeps } from './submit'

// ---------------- diffQuotes ----------------

const item = (nftId: string, unitPrice: string, quantity = 1, editionType: Quote['items'][number]['editionType'] = 'ABERTA') => ({
  nftId,
  nftName: `NFT ${nftId}`,
  nftImage: '/assets/nfts/ape-green.png',
  editionType,
  quantity,
  unitPrice,
  subtotal: unitPrice,
})

const quote = (changes: Partial<Quote> = {}): Quote => ({
  quoteId: 'quote_1',
  version: 1,
  items: [item('a', '1.00'), item('b', '0.50')],
  subtotal: '1.50',
  discount: '0',
  networkFee: '0.016',
  total: '1.516',
  couponStatus: 'not_applied',
  expiresAt: '2026-12-01T12:00:00.000Z',
  ...changes,
})

describe('diffQuotes', () => {
  it('is empty for the same values even with new ids and versions, and ignores decimal formatting', () => {
    expect(diffQuotes(quote(), quote({ quoteId: 'quote_9', version: 9 }))).toEqual([])
    expect(diffQuotes(quote({ discount: '0' }), quote({ discount: '0.00' }))).toEqual([])
  })

  it('reports a price change with the old and new unit price and the new total', () => {
    const changes = diffQuotes(quote(), quote({ items: [item('a', '1.10'), item('b', '0.50')], subtotal: '1.60', total: '1.616' }))
    expect(changes.map((change) => change.kind)).toEqual(['price', 'total'])
    expect(changes[0].message).toContain('de 1.00 para 1.10 ETH')
    expect(changes[1].message).toContain('de 1.516 para 1.616 ETH')
  })

  it('reports removed, added and quantity changes', () => {
    const changes = diffQuotes(quote(), quote({ items: [item('a', '1.00', 3), item('c', '2.00')], subtotal: '5.00', total: '5.016' }))
    const kinds = changes.map((change) => change.kind)
    expect(kinds).toContain('quantity')
    expect(kinds).toContain('removed')
    expect(kinds).toContain('added')
    expect(kinds).toContain('total')
  })

  it('reports coupon, discount and fee changes', () => {
    const changes = diffQuotes(
      quote({ coupon: 'KURIO10', couponStatus: 'valid', discount: '0.15', total: '1.366' }),
      quote({ discount: '0', total: '1.516', networkFee: '0.020' }),
    )
    const kinds = changes.map((change) => change.kind)
    expect(kinds).toContain('coupon')
    expect(kinds).toContain('discount')
    expect(kinds).toContain('fee')
  })
})

// ---------------- checkout-store ----------------

const draft: CheckoutDraft = {
  displayName: 'Alice',
  userName: 'alice_naka',
  profileName: 'Alice',
  email: 'alice@nft.test',
  note: '',
  referralCode: '',
  walletId: 'wallet_alice_primary',
  network: 'Ethereum',
  step: 'review',
}

const request: OrderCreateInput = {
  collector: { displayName: 'Alice', userName: 'alice_naka', profileName: 'Alice', email: 'alice@nft.test' },
  walletId: 'wallet_alice_primary',
  network: 'Ethereum',
  quoteId: 'quote_1',
  quoteVersion: 1,
}

const attempt: CheckoutAttempt = { key: 'idem_0123456789abcdef', request, createdAt: 1 }

describe('checkout store', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('keeps draft and attempt separately and per user', () => {
    saveDraft('user_alice', draft)
    saveAttempt('user_alice', attempt)

    expect(loadCheckoutState('user_alice')).toEqual({ draft, attempt })
    expect(loadCheckoutState('user_bob')).toEqual({})

    saveAttempt('user_alice', { ...attempt, orderId: 'order_7' })
    expect(loadCheckoutState('user_alice').attempt?.orderId).toBe('order_7')
    expect(loadCheckoutState('user_alice').draft).toEqual(draft)

    saveAttempt('user_alice', null)
    expect(loadCheckoutState('user_alice')).toEqual({ draft })

    clearCheckoutState('user_alice')
    expect(loadCheckoutState('user_alice')).toEqual({})
  })

  it('discards corrupt or tampered data', () => {
    window.sessionStorage.setItem('kurio:checkout:user_alice', '{quebrado')
    expect(loadCheckoutState('user_alice')).toEqual({})

    window.sessionStorage.setItem('kurio:checkout:user_alice', JSON.stringify({ attempt: { key: 'x', request: {}, createdAt: 1 } }))
    expect(loadCheckoutState('user_alice')).toEqual({})
  })

  it('generates unique 128-bit idempotency keys', () => {
    const keys = new Set(Array.from({ length: 50 }, () => newIdempotencyKey()))
    expect(keys.size).toBe(50)
    for (const key of keys) expect(key).toMatch(/^idem_[0-9a-f]{32}$/)
  })
})

// ---------------- submitOrder ----------------

const order = { id: 'order_1', status: 'pending' } as unknown as Order

function axiosError(status: number | null): AxiosError {
  const config = { headers: {} } as InternalAxiosRequestConfig
  if (status === null) return new AxiosError('timeout', AxiosError.ECONNABORTED, config)
  const response: AxiosResponse = { data: { code: 'X', message: 'x' }, status, statusText: '', headers: {}, config }
  return new AxiosError('failed', AxiosError.ERR_BAD_RESPONSE, config, null, response)
}

function deps(results: Array<Error | { order: Order; created: boolean }>) {
  const keys: string[] = []
  const sleeps: number[] = []
  const queue = [...results]
  const api: SubmitDeps = {
    post: (_request, key) => {
      keys.push(key)
      const next = queue.shift()
      if (!next) return Promise.reject(new Error('sem resposta configurada'))
      return next instanceof Error ? Promise.reject(next) : Promise.resolve(next)
    },
    sleep: (ms) => {
      sleeps.push(ms)
      return Promise.resolve()
    },
  }
  return { api, keys, sleeps }
}

describe('submitOrder', () => {
  it('places the order on the first attempt', async () => {
    const { api, keys } = deps([{ order, created: true }])
    const outcome = await submitOrder(api, request, 'idem_aaaaaaaaaaaa')
    expect(outcome).toEqual({ kind: 'placed', order, created: true, attempts: 1 })
    expect(keys).toEqual(['idem_aaaaaaaaaaaa'])
  })

  it('retries after a timeout with the SAME key and recovers the same order', async () => {
    const { api, keys, sleeps } = deps([axiosError(null), { order, created: false }])
    const outcome = await submitOrder(api, request, 'idem_bbbbbbbbbbbb')

    expect(outcome).toEqual({ kind: 'placed', order, created: false, attempts: 2 })
    expect(keys).toEqual(['idem_bbbbbbbbbbbb', 'idem_bbbbbbbbbbbb'])
    expect(sleeps).toEqual([800])
  })

  it('also retries 5xx but gives up after the last attempt, saying the order may exist', async () => {
    const { api, keys, sleeps } = deps([axiosError(503), axiosError(null), axiosError(503)])
    const outcome = await submitOrder(api, request, 'idem_cccccccccccc')

    expect(outcome).toEqual({ kind: 'unreachable', attempts: 3 })
    expect(new Set(keys).size).toBe(1)
    expect(sleeps).toEqual([800, 1600])
  })

  it('does not retry a 4xx: nothing was created and resending cannot help', async () => {
    const { api, keys } = deps([axiosError(409), { order, created: true }])
    const outcome = await submitOrder(api, request, 'idem_dddddddddddd')

    expect(outcome.kind).toBe('rejected')
    expect(keys).toHaveLength(1)
  })

  it('classifies retryable failures', () => {
    expect(isRetryable(axiosError(null))).toBe(true)
    expect(isRetryable(axiosError(500))).toBe(true)
    expect(isRetryable(axiosError(409))).toBe(false)
    expect(isRetryable(new Error('x'))).toBe(false)
  })
})

// ---------------- formulários ----------------

describe('forms', () => {
  const valid = {
    displayName: 'Alice',
    userName: 'alice_naka',
    profileName: 'Alice',
    email: 'alice@nft.test',
    referralCode: '',
    note: '',
    walletId: 'wallet_alice_primary',
    network: 'Ethereum',
  }

  it('accepts valid checkout data and an empty optional referral code and note', () => {
    expect(checkoutFormSchema.safeParse(valid).success).toBe(true)
  })

  it('reports field errors in portuguese', () => {
    const result = checkoutFormSchema.safeParse({ ...valid, displayName: '', userName: 'a b', email: 'x', walletId: '', referralCode: '!!' })
    expect(result.success).toBe(false)
    if (result.success) return
    const fields = result.error.issues.map((issue) => issue.path[0])
    expect(fields).toContain('displayName')
    expect(fields).toContain('userName')
    expect(fields).toContain('email')
    expect(fields).toContain('walletId')
    expect(fields).toContain('referralCode')
    expect(result.error.issues.find((issue) => issue.path[0] === 'walletId')?.message).toBe('Escolha uma carteira.')
  })

  it('validates the new wallet form', () => {
    const good = { nickname: 'Reserva', network: 'Polygon', address: `0x${'ab'.repeat(20)}`, type: 'MetaMask', ensName: '' }
    expect(newWalletFormSchema.safeParse(good).success).toBe(true)
    expect(newWalletFormSchema.safeParse({ ...good, ensName: 'nova.eth' }).success).toBe(true)
    expect(newWalletFormSchema.safeParse({ ...good, address: '0x123' }).success).toBe(false)
    expect(newWalletFormSchema.safeParse({ ...good, ensName: 'nova.com' }).success).toBe(false)
  })
})
