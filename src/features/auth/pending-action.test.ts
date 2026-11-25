import { beforeEach, describe, expect, it } from 'vitest'
import { loginUrlFor, setPendingAction, takePendingAction } from './pending-action'

beforeEach(() => {
  window.sessionStorage.clear()
})

describe('pending action', () => {
  it('is taken exactly once', () => {
    setPendingAction({ type: 'favorite', nftId: 'nft_004' })
    expect(takePendingAction()).toEqual({ type: 'favorite', nftId: 'nft_004' })
    expect(takePendingAction()).toBeNull()
  })

  it('keeps the add-to-cart payload', () => {
    setPendingAction({ type: 'add-to-cart', nftId: 'nft_002', editionType: '1/10', quantity: 2, buyNow: true })
    expect(takePendingAction()).toEqual({
      type: 'add-to-cart',
      nftId: 'nft_002',
      editionType: '1/10',
      quantity: 2,
      buyNow: true,
    })
  })

  it('discards invalid or tampered data', () => {
    window.sessionStorage.setItem('kurio:pending-action', '{"type":"drop-database"}')
    expect(takePendingAction()).toBeNull()

    window.sessionStorage.setItem('kurio:pending-action', 'não é json')
    expect(takePendingAction()).toBeNull()

    window.sessionStorage.setItem(
      'kurio:pending-action',
      JSON.stringify({ type: 'add-to-cart', nftId: 'x', editionType: '9/99', quantity: 0, buyNow: false }),
    )
    expect(takePendingAction()).toBeNull()
  })

  it('builds a login url that returns to the current page', () => {
    expect(loginUrlFor('/nft/nft_002?x=1')).toBe('/login?redirect=%2Fnft%2Fnft_002%3Fx%3D1')
  })
})
