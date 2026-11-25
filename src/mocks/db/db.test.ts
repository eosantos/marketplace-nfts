import { beforeEach, describe, expect, it } from 'vitest'
import { CartSchema, NftSchema, UserSchema, WalletSchema } from '@/shared/contracts'
import {
  NFT_IMAGE_PATHS,
  cartFixtures,
  couponFixtures,
  favoriteFixtures,
  nftFixtures,
  userFixtures,
  walletFixtures,
} from '../fixtures'
import { clearMemoryDb, getDb, resetDb, saveDb } from './index'

const ETH_DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/

beforeEach(() => {
  window.localStorage.clear()
  clearMemoryDb()
})

describe('fixtures', () => {
  it('has at least 60 NFTs reusing the four local images', () => {
    expect(nftFixtures.length).toBeGreaterThanOrEqual(60)

    const images = new Set(nftFixtures.map((nft) => nft.image))
    expect(images.size).toBe(4)
    expect([...images].sort()).toEqual([...NFT_IMAGE_PATHS].sort())

    for (const nft of nftFixtures) {
      expect(nft.price).toMatch(ETH_DECIMAL)
      expect(nft.image.startsWith('/assets/nfts/')).toBe(true)
      expect(nft.editions.map((edition) => edition.type)).toEqual(['1/1', '1/10', '1/50', 'ABERTA'])
    }
  })

  it('provides two users with isolated carts, favorites and wallets', () => {
    expect(userFixtures.length).toBeGreaterThanOrEqual(2)

    const userIds = new Set(userFixtures.map((user) => user.id))

    for (const user of userFixtures) {
      expect(walletFixtures.some((wallet) => wallet.userId === user.id)).toBe(true)
      expect(cartFixtures.some((cart) => cart.userId === user.id)).toBe(true)
      expect(user.passwordHash).not.toBe('')
      expect(user.passwordSalt).not.toBe('')
    }

    for (const favorite of favoriteFixtures) {
      expect(userIds.has(favorite.userId)).toBe(true)
    }
  })

  it('has valid, invalid and expired coupons', () => {
    const statuses = new Set(couponFixtures.map((coupon) => coupon.status))
    expect(statuses).toEqual(new Set(['active', 'invalid', 'expired']))
    for (const coupon of couponFixtures) {
      expect(coupon.value).toMatch(ETH_DECIMAL)
    }
  })

  it('validates all fixtures against the shared contracts', () => {
    expect(() => NftSchema.array().parse(nftFixtures)).not.toThrow()
    expect(() => WalletSchema.array().parse(walletFixtures)).not.toThrow()
    expect(() => CartSchema.array().parse(cartFixtures)).not.toThrow()
    for (const user of userFixtures) {
      expect(() => UserSchema.parse(user)).not.toThrow()
    }
  })
})

describe('mock database', () => {
  it('restores the full default scenario', () => {
    const db = resetDb('default')

    expect(db.scenario).toBe('default')
    expect(db.nfts).toHaveLength(64)
    expect(db.users).toHaveLength(2)
    expect(db.favorites.length).toBeGreaterThan(0)
    expect(db.carts.every((cart) => cart.items.length > 0)).toBe(true)
  })

  it('restores the empty scenario without catalog data', () => {
    const db = resetDb('empty')

    expect(db.scenario).toBe('empty')
    expect(db.nfts).toHaveLength(0)
    expect(db.favorites).toHaveLength(0)
    expect(db.carts.every((cart) => cart.items.length === 0)).toBe(true)
    expect(db.users).toHaveLength(2)
  })

  it('persists mutations and reset discards them', () => {
    const db = resetDb('default')
    db.nfts.splice(0, 1)
    saveDb(db)

    clearMemoryDb()
    expect(getDb().nfts).toHaveLength(63)

    expect(resetDb('default').nfts).toHaveLength(64)
  })

  it('falls back to default for an unknown scenario', () => {
    const db = resetDb('does-not-exist')

    expect(db.scenario).toBe('default')
    expect(db.nfts).toHaveLength(64)
  })
})
