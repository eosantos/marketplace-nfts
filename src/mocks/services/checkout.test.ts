import { Decimal } from 'decimal.js'
import { beforeEach, describe, expect, it } from 'vitest'
import { EthAmountSchema, type ApiError, type Quote, type QuoteRequest } from '@/shared/contracts'
import { getDb, mutateDb, resetDb } from '../db'
import { onMockDbEvent, type MockDbEvent } from '../events'
import type { ServiceResult } from '../http/result'
import type { MockScenario } from '../scenarios/names'
import { stableStringify } from '../util/stable'
import { getCart } from './cart'
import { getNft } from './catalog'
import { createOrder, getOrder, settleOrder } from './orders'
import { createQuote } from './quote'
import { setWalletConnection } from './wallets'

beforeEach(() => {
  resetDb('default')
  setWalletConnection('user_alice', 'wallet_alice_primary', true)
  setWalletConnection('user_bob', 'wallet_bob_primary', true)
})

function unwrap<T>(result: ServiceResult<T>): T {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)
  return result.data
}

function failure<T>(result: ServiceResult<T>): ApiError {
  if (result.ok) throw new Error('Esperava falha, mas a operação teve sucesso')
  return result.error
}

function use(scenario: MockScenario): void {
  mutateDb((db) => {
    db.scenario = scenario
  })
}

const ONE_EDITION: QuoteRequest['items'] = [{ nftId: 'nft_002', editionType: '1/10', quantity: 1 }]
const TWO_NFTS: QuoteRequest['items'] = [
  { nftId: 'nft_002', editionType: '1/10', quantity: 2 },
  { nftId: 'nft_003', editionType: '1/1', quantity: 1 },
]

function quoteFor(userId: string, items: QuoteRequest['items'], coupon?: string): Quote {
  return unwrap(createQuote(userId, { items, ...(coupon ? { coupon } : {}) }))
}

function orderInput(quote: Quote, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    collector: {
      displayName: 'Alice Nakamura',
      userName: 'alice_naka',
      profileName: 'Alice no País dos NFTs',
      email: 'alice@nft.test',
    },
    walletId: 'wallet_alice_primary',
    network: 'Ethereum',
    quoteId: quote.quoteId,
    quoteVersion: quote.version,
    ...extra,
  }
}

function available(nftId: string, editionType: string): number | undefined {
  return unwrap(getNft(nftId)).editions.find((edition) => edition.type === editionType)?.available
}

describe('quote', () => {
  it('computes subtotal, fee and total with decimal.js', () => {
    const a = unwrap(getNft('nft_002'))
    const b = unwrap(getNft('nft_003'))
    const quote = quoteFor('user_alice', TWO_NFTS)

    const subtotal = new Decimal(a.price).times(2).plus(b.price)
    expect(quote.subtotal).toBe(subtotal.toFixed())
    expect(quote.networkFee).toBe('0.016')
    expect(quote.discount).toBe('0')
    expect(quote.total).toBe(subtotal.plus('0.016').toFixed())
    expect(quote.couponStatus).toBe('not_applied')
    expect(quote.items).toHaveLength(2)

    for (const value of [quote.subtotal, quote.discount, quote.networkFee, quote.total]) {
      expect(EthAmountSchema.safeParse(value).success).toBe(true)
    }
  })

  it('applies percent and fixed coupons', () => {
    const base = quoteFor('user_alice', TWO_NFTS)

    const percent = quoteFor('user_alice', TWO_NFTS, 'KURIO10')
    expect(percent.couponStatus).toBe('valid')
    expect(percent.coupon).toBe('KURIO10')
    expect(percent.discount).toBe(new Decimal(base.subtotal).times('0.1').toDecimalPlaces(6).toFixed())

    const fixed = quoteFor('user_alice', TWO_NFTS, 'KURIO25')
    expect(fixed.discount).toBe('0.25')
    expect(fixed.total).toBe(new Decimal(base.subtotal).minus('0.25').plus('0.016').toFixed())
  })

  it('rejects invalid and expired coupons with a coupon field error', () => {
    const invalid = failure(createQuote('user_alice', { items: TWO_NFTS, coupon: 'NOPE' }))
    expect(invalid.code).toBe('COUPON_INVALID')
    expect(invalid.fieldErrors?.[0].field).toBe('coupon')

    expect(failure(createQuote('user_alice', { items: TWO_NFTS, coupon: 'KURIO-INVALIDO' })).code).toBe(
      'COUPON_INVALID',
    )
    expect(failure(createQuote('user_alice', { items: TWO_NFTS, coupon: 'KURIO-VENCIDO' })).code).toBe(
      'COUPON_EXPIRED',
    )
  })

  it('lets the coupon scenarios override even a valid coupon', () => {
    use('coupon-expired')
    expect(failure(createQuote('user_alice', { items: TWO_NFTS, coupon: 'KURIO10' })).code).toBe(
      'COUPON_EXPIRED',
    )
    use('coupon-invalid')
    expect(failure(createQuote('user_alice', { items: TWO_NFTS, coupon: 'KURIO10' })).code).toBe(
      'COUPON_INVALID',
    )
  })

  it('numbers quotes incrementally, merges repeated lines and validates stock', () => {
    const first = quoteFor('user_alice', ONE_EDITION)
    const second = quoteFor('user_alice', ONE_EDITION)
    expect(first.quoteId).toBe('quote_1')
    expect(second.quoteId).toBe('quote_2')
    expect(second.version).toBe(first.version + 1)

    const merged = quoteFor('user_alice', [
      { nftId: 'nft_002', editionType: 'ABERTA', quantity: 2 },
      { nftId: 'nft_002', editionType: 'ABERTA', quantity: 2 },
    ])
    expect(merged.items).toHaveLength(1)
    expect(merged.items[0].quantity).toBe(4)

    expect(failure(createQuote('user_alice', { items: [] })).code).toBe('VALIDATION_ERROR')
    expect(
      failure(createQuote('user_alice', { items: [{ nftId: 'nft_001', editionType: '1/1', quantity: 1 }] })).code,
    ).toBe('AVAILABILITY_CONFLICT')
    expect(
      failure(createQuote('user_alice', { items: [{ nftId: 'nao_existe', editionType: '1/1', quantity: 1 }] })).code,
    ).toBe('NOT_FOUND')
  })
})

describe('orders: creation and idempotency', () => {
  it('creates a pending order with an immutable snapshot', () => {
    const quote = quoteFor('user_alice', ONE_EDITION)
    const { order, created, dropResponse } = unwrap(createOrder('user_alice', 'key-1', orderInput(quote)))

    expect(created).toBe(true)
    expect(dropResponse).toBe(false)
    expect(order.id).toBe('order_1')
    expect(order.status).toBe('pending')
    expect(order.txRef).toBeUndefined()
    expect(order.snapshot.total).toBe(quote.total)
    expect(order.snapshot.items[0].tokenId).toBe(unwrap(getNft('nft_002')).tokenId)
    expect(order.snapshot.collector.walletAddress).toBe('0x4C1E9A7B2D3F5A6B7C8D9E0F1A2B3C4D5E6F7A8B')

    // Mudar o catálogo depois não altera o recibo.
    mutateDb((db) => {
      db.nfts[1].name = 'Renomeado'
    })
    expect(unwrap(getOrder('user_alice', order.id)).snapshot.items[0].nftName).not.toBe('Renomeado')
  })

  it('returns the same order for the same key and body, and conflicts on a different body', () => {
    const quote = quoteFor('user_alice', ONE_EDITION)
    const input = orderInput(quote)

    const first = unwrap(createOrder('user_alice', 'key-1', input))
    const replay = unwrap(createOrder('user_alice', 'key-1', input))
    expect(replay.created).toBe(false)
    expect(replay.order.id).toBe(first.order.id)
    expect(getDb().orders).toHaveLength(1)

    const conflict = failure(createOrder('user_alice', 'key-1', { ...input, note: 'outra observação' }))
    expect(conflict.code).toBe('IDEMPOTENCY_CONFLICT')
    expect(getDb().orders).toHaveLength(1)
  })

  it('treats key order in the body as the same request and isolates keys per user', () => {
    const quote = quoteFor('user_alice', ONE_EDITION)
    const input = orderInput(quote)
    const reordered = Object.fromEntries(Object.entries(input).reverse())
    expect(stableStringify(input)).toBe(stableStringify(reordered))

    unwrap(createOrder('user_alice', 'key-1', input))
    expect(unwrap(createOrder('user_alice', 'key-1', reordered)).created).toBe(false)

    const bobQuote = quoteFor('user_bob', [{ nftId: 'nft_004', editionType: '1/50', quantity: 1 }])
    const bobOrder = unwrap(
      createOrder('user_bob', 'key-1', {
        ...orderInput(bobQuote),
        walletId: 'wallet_bob_primary',
        network: 'Solana',
      }),
    )
    expect(bobOrder.created).toBe(true)
    expect(getDb().orders).toHaveLength(2)
  })

  it('requires the Idempotency-Key header', () => {
    const input = orderInput(quoteFor('user_alice', ONE_EDITION))
    expect(failure(createOrder('user_alice', null, input)).fieldErrors?.[0].field).toBe('Idempotency-Key')
    expect(failure(createOrder('user_alice', '   ', input)).code).toBe('VALIDATION_ERROR')
  })

  it('validates wallet ownership and quote ownership, version and expiry', () => {
    const quote = quoteFor('user_alice', ONE_EDITION)

    expect(failure(createOrder('user_alice', 'a', orderInput(quote, { walletId: 'nope' }))).code).toBe('NOT_FOUND')
    expect(
      failure(createOrder('user_alice', 'b', orderInput(quote, { walletId: 'wallet_bob_primary' }))).code,
    ).toBe('FORBIDDEN')
    expect(failure(createOrder('user_alice', 'c', orderInput(quote, { quoteVersion: 99 }))).code).toBe(
      'PRICE_CHANGED',
    )
    expect(failure(createOrder('user_bob', 'd', orderInput(quote, { walletId: 'wallet_bob_primary' }))).code).toBe(
      'NOT_FOUND',
    )

    mutateDb((db) => {
      db.quotes[0].expiresAt = '2020-01-01T00:00:00.000Z'
    })
    expect(failure(createOrder('user_alice', 'e', orderInput(quote))).code).toBe('PRICE_CHANGED')
  })

  it('rejects a quote whose price changed in the catalog', () => {
    const quote = quoteFor('user_alice', ONE_EDITION)
    mutateDb((db) => {
      db.nfts[1].price = '9.99'
    })
    expect(failure(createOrder('user_alice', 'k', orderInput(quote))).code).toBe('PRICE_CHANGED')
  })
})

describe('orders: wallet connection', () => {
  it('requires a connected wallet and lets a replay through even after disconnecting', () => {
    const quote = quoteFor('user_alice', ONE_EDITION)
    const input = orderInput(quote)

    setWalletConnection('user_alice', 'wallet_alice_primary', false)
    const blocked = failure(createOrder('user_alice', 'key-1', input))
    expect(blocked.code).toBe('FORBIDDEN')
    expect(blocked.message).toContain('Conecte a carteira')
    expect(getDb().orders).toHaveLength(0)

    setWalletConnection('user_alice', 'wallet_alice_primary', true)
    const created = unwrap(createOrder('user_alice', 'key-1', input))
    expect(created.created).toBe(true)

    // O reenvio idempotente devolve o mesmo pedido mesmo que a carteira tenha sido desconectada.
    setWalletConnection('user_alice', 'wallet_alice_primary', false)
    const replay = unwrap(createOrder('user_alice', 'key-1', input))
    expect(replay.created).toBe(false)
    expect(replay.order.id).toBe(created.order.id)
  })

  it('refuses to connect in the wallet-refused scenario but still allows disconnecting', () => {
    use('wallet-refused')
    const refused = failure(setWalletConnection('user_alice', 'wallet_alice_primary', true))
    expect(refused.code).toBe('FORBIDDEN')
    expect(refused.message).toContain('recusada')

    expect(unwrap(setWalletConnection('user_alice', 'wallet_alice_primary', false)).connected).toBe(false)
  })
})

describe('orders: state machine', () => {
  it('confirms: tx reference, stock decrement and only the purchased quantity leaves the cart', () => {
    expect(available('nft_002', '1/10')).toBe(4)
    const quote = quoteFor('user_alice', ONE_EDITION)
    const { order } = unwrap(createOrder('user_alice', 'key-1', orderInput(quote)))

    const settled = unwrap(settleOrder(order.id))
    expect(settled.status).toBe('confirmed')
    expect(settled.txRef).toMatch(/^0x[0-9a-f]{64}$/)
    expect(settled.txExplorerUrl).toContain('etherscan.io/tx/')
    expect(available('nft_002', '1/10')).toBe(3)

    // Alice tinha 2 unidades dessa edição no carrinho e comprou 1.
    const line = unwrap(getCart('user_alice')).items.find((item) => item.id === 'cart_alice_001')
    expect(line?.quantity).toBe(1)
    expect(unwrap(getCart('user_alice')).items).toHaveLength(2)
  })

  it('removes the cart line when the whole quantity is purchased', () => {
    const quote = quoteFor('user_alice', [{ nftId: 'nft_002', editionType: '1/10', quantity: 2 }])
    const { order } = unwrap(createOrder('user_alice', 'key-1', orderInput(quote)))
    unwrap(settleOrder(order.id))
    expect(unwrap(getCart('user_alice')).items.some((item) => item.id === 'cart_alice_001')).toBe(false)
  })

  it('never regresses a terminal state', () => {
    const quote = quoteFor('user_alice', ONE_EDITION)
    const { order } = unwrap(createOrder('user_alice', 'key-1', orderInput(quote)))
    const confirmed = unwrap(settleOrder(order.id))

    mutateDb((db) => {
      db.orderSettlements = { [order.id]: { at: 0, outcome: 'refused' } }
    })
    const again = unwrap(settleOrder(order.id))
    expect(again.status).toBe('confirmed')
    expect(again.txRef).toBe(confirmed.txRef)
    expect(available('nft_002', '1/10')).toBe(3)
  })

  it('refuses without touching stock or cart in the payment-refused scenario', () => {
    use('payment-refused')
    const quote = quoteFor('user_alice', ONE_EDITION)
    const { order } = unwrap(createOrder('user_alice', 'key-1', orderInput(quote)))

    const settled = unwrap(settleOrder(order.id))
    expect(settled.status).toBe('refused')
    expect(settled.txRef).toBeUndefined()
    expect(available('nft_002', '1/10')).toBe(4)
    expect(unwrap(getCart('user_alice')).items.find((item) => item.id === 'cart_alice_001')?.quantity).toBe(2)
  })

  it('settles lazily when the deadline passed and protects other users orders', () => {
    const quote = quoteFor('user_alice', ONE_EDITION)
    const { order } = unwrap(createOrder('user_alice', 'key-1', orderInput(quote)))

    expect(unwrap(getOrder('user_alice', order.id)).status).toBe('pending')

    mutateDb((db) => {
      db.orderSettlements = { [order.id]: { at: 0, outcome: 'confirmed' } }
    })
    expect(unwrap(getOrder('user_alice', order.id)).status).toBe('confirmed')

    expect(failure(getOrder('user_bob', order.id)).code).toBe('FORBIDDEN')
    expect(failure(getOrder('user_alice', 'order_999')).code).toBe('NOT_FOUND')
  })

  it('confirms in the payment-confirmed scenario like the default flow', () => {
    use('payment-confirmed')
    const quote = quoteFor('user_alice', ONE_EDITION)
    const { order } = unwrap(createOrder('user_alice', 'key-1', orderInput(quote)))
    expect(unwrap(settleOrder(order.id)).status).toBe('confirmed')
  })
})

describe('orders: checkout scenarios', () => {
  it('price-changed-at-checkout: the first attempt fails, a new quote reflects the new price', () => {
    use('price-changed-at-checkout')
    const stale = quoteFor('user_alice', ONE_EDITION)
    expect(failure(createOrder('user_alice', 'k1', orderInput(stale))).code).toBe('PRICE_CHANGED')

    const fresh = quoteFor('user_alice', ONE_EDITION)
    expect(new Decimal(fresh.items[0].unitPrice).minus(stale.items[0].unitPrice).toFixed()).toBe('0.1')

    const created = unwrap(createOrder('user_alice', 'k2', orderInput(fresh)))
    expect(created.order.status).toBe('pending')
  })

  it('sold-out-at-checkout: the first attempt fails and the edition stays sold out', () => {
    use('sold-out-at-checkout')
    const quote = quoteFor('user_alice', ONE_EDITION)
    expect(failure(createOrder('user_alice', 'k1', orderInput(quote))).code).toBe('AVAILABILITY_CONFLICT')

    expect(available('nft_002', '1/10')).toBe(0)
    expect(failure(createQuote('user_alice', { items: ONE_EDITION })).code).toBe('AVAILABILITY_CONFLICT')
  })

  it('timeout-after-order-created: the order exists, the response is lost, a retry returns it', () => {
    use('timeout-after-order-created')
    const quote = quoteFor('user_alice', ONE_EDITION)
    const input = orderInput(quote)

    const first = unwrap(createOrder('user_alice', 'key-1', input))
    expect(first.created).toBe(true)
    expect(first.dropResponse).toBe(true)

    const retry = unwrap(createOrder('user_alice', 'key-1', input))
    expect(retry.created).toBe(false)
    expect(retry.dropResponse).toBe(false)
    expect(retry.order.id).toBe(first.order.id)
    expect(getDb().orders).toHaveLength(1)
  })
})

describe('db event bus', () => {
  it('emits order and nft events for the realtime layer', () => {
    const events: MockDbEvent[] = []
    const unsubscribe = onMockDbEvent((event) => {
      events.push(event)
    })

    const quote = quoteFor('user_alice', ONE_EDITION)
    const { order } = unwrap(createOrder('user_alice', 'key-1', orderInput(quote)))
    expect(events.map((event) => event.type)).toEqual(['order.updated'])

    unwrap(settleOrder(order.id))
    const types = events.map((event) => event.type)
    expect(types).toContain('nft.updated')
    expect(types.filter((type) => type === 'order.updated')).toHaveLength(2)

    unsubscribe()
    unwrap(settleOrder(order.id))
    expect(events.length).toBe(types.length)
  })
})
