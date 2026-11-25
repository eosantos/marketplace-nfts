import { webcrypto } from 'node:crypto'
import { Decimal } from 'decimal.js'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { ApiError } from '@/shared/contracts'
import { mutateDb, resetDb } from '../db'
import type { ServiceResult } from '../http/result'
import { login, register } from './auth'
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from './cart'
import { getFacets, getNft, listNfts } from './catalog'
import { addFavorite, listFavorites, removeFavorite } from './favorites'
import {
  AVATAR_MAX_BYTES,
  changePassword,
  getProfile,
  updateProfile,
  uploadAvatar,
} from './profile'
import { createWallet, listWallets, setWalletConnection, updateWallet } from './wallets'

beforeAll(() => {
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
  }
})

beforeEach(() => {
  resetDb('default')
})

function unwrap<T>(result: ServiceResult<T>): T {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)
  return result.data
}

function failure<T>(result: ServiceResult<T>): ApiError {
  if (result.ok) throw new Error('Esperava falha, mas a operação teve sucesso')
  return result.error
}

function setScenario(scenario: 'signup-conflict'): void {
  mutateDb((db) => {
    db.scenario = scenario
  })
}

const NEW_USER = {
  email: 'novo@nft.test',
  password: 'Senha@1234',
  displayName: 'Novo Colecionador',
  userName: 'novo_user',
  profileName: 'Novo Perfil',
}

describe('auth', () => {
  it('logs in a demo user without exposing credentials', async () => {
    const auth = unwrap(await login({ email: 'alice@nft.test', password: 'Alice@123' }))
    expect(auth.user.email).toBe('alice@nft.test')
    expect(auth.session.token).toMatch(/^kurio_/)
    expect(JSON.stringify(auth)).not.toContain('passwordHash')
  })

  it('rejects a wrong password with UNAUTHENTICATED', async () => {
    const error = failure(await login({ email: 'alice@nft.test', password: 'errada' }))
    expect(error.code).toBe('UNAUTHENTICATED')
  })

  it('registers a user, logs in with it and rejects a duplicate e-mail', async () => {
    const created = unwrap(await register(NEW_USER))
    expect(created.user.email).toBe(NEW_USER.email)

    unwrap(await login({ email: NEW_USER.email, password: NEW_USER.password }))

    const duplicate = failure(await register({ ...NEW_USER, email: 'NOVO@nft.test', userName: 'outro' }))
    expect(duplicate.code).toBe('EMAIL_TAKEN')
  })

  it('returns field errors for invalid input', async () => {
    const error = failure(await register({ ...NEW_USER, password: '123' }))
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.fieldErrors?.some((item) => item.field === 'password')).toBe(true)
  })

  it('forces EMAIL_TAKEN in the signup-conflict scenario', async () => {
    setScenario('signup-conflict')
    const error = failure(await register(NEW_USER))
    expect(error.code).toBe('EMAIL_TAKEN')
  })
})

describe('catalog', () => {
  it('paginates the default catalog', () => {
    const page1 = unwrap(listNfts({}))
    expect(page1.total).toBe(64)
    expect(page1.pageSize).toBe(9)
    expect(page1.items).toHaveLength(9)

    const lastPage = unwrap(listNfts({ page: '8' }))
    expect(lastPage.items).toHaveLength(1)

    const page2 = unwrap(listNfts({ page: '2' }))
    expect(page2.items.map((nft) => nft.id)).not.toEqual(page1.items.map((nft) => nft.id))
  })

  it('filters by network and price range', () => {
    const byNetwork = unwrap(listNfts({ network: 'Solana', pageSize: '60' }))
    expect(byNetwork.items.length).toBeGreaterThan(0)
    expect(byNetwork.items.every((nft) => nft.network === 'Solana')).toBe(true)

    const byPrice = unwrap(listNfts({ minPrice: '1.00', maxPrice: '2.00', pageSize: '60' }))
    expect(byPrice.items.length).toBeGreaterThan(0)
    expect(
      byPrice.items.every((nft) => new Decimal(nft.price).gte('1.00') && new Decimal(nft.price).lte('2.00')),
    ).toBe(true)
  })

  it('searches ignoring case and accents', () => {
    const result = unwrap(listNfts({ q: 'EMERALD', pageSize: '60' }))
    expect(result.items.length).toBeGreaterThan(0)
    expect(
      result.items.every((nft) => `${nft.name} ${nft.collection}`.toLowerCase().includes('emerald')),
    ).toBe(true)
  })

  it('sorts by price ascending', () => {
    const { items } = unwrap(listNfts({ orderBy: 'preco-asc', pageSize: '60' }))
    for (let index = 1; index < items.length; index += 1) {
      expect(new Decimal(items[index].price).gte(items[index - 1].price)).toBe(true)
    }
  })

  it('rejects invalid params with VALIDATION_ERROR', () => {
    expect(failure(listNfts({ page: '0' })).code).toBe('VALIDATION_ERROR')
    expect(failure(listNfts({ network: 'Marte' })).code).toBe('VALIDATION_ERROR')
  })

  it('computes facets that add up to the catalog size', () => {
    const facets = unwrap(getFacets())
    const sum = (entries: { count: number }[]) => entries.reduce((total, entry) => total + entry.count, 0)
    expect(sum(facets.categories)).toBe(64)
    expect(sum(facets.networks)).toBe(64)
    expect(facets.priceRange).toEqual({ min: '0.02', max: '12.30' })
  })

  it('returns NOT_FOUND for an unknown NFT and an empty catalog in the empty scenario', () => {
    expect(unwrap(getNft('nft_001')).id).toBe('nft_001')
    expect(failure(getNft('nft_nao_existe')).code).toBe('NOT_FOUND')

    // O reset do cenário `empty` é o caminho oficial para o catálogo vazio.
    resetDb('empty')
    expect(unwrap(listNfts({})).total).toBe(0)
  })
})

describe('favorites', () => {
  it('adds idempotently, removes and keeps users isolated', () => {
    expect(unwrap(listFavorites('user_alice'))).toHaveLength(3)

    unwrap(addFavorite('user_alice', { nftId: 'nft_001' }))
    unwrap(addFavorite('user_alice', { nftId: 'nft_001' }))
    expect(unwrap(listFavorites('user_alice'))).toHaveLength(4)

    unwrap(removeFavorite('user_alice', 'nft_001'))
    expect(unwrap(listFavorites('user_alice'))).toHaveLength(3)
    expect(unwrap(listFavorites('user_bob'))).toHaveLength(2)
  })

  it('returns NOT_FOUND for an unknown NFT', () => {
    expect(failure(addFavorite('user_alice', { nftId: 'nope' })).code).toBe('NOT_FOUND')
    expect(failure(removeFavorite('user_alice', 'nope')).code).toBe('NOT_FOUND')
  })
})

describe('cart', () => {
  it('merges the same nft + edition and enforces the per-buyer limit', () => {
    expect(unwrap(getCart('user_alice')).items).toHaveLength(2)

    // nft_002 ABERTA: limite por comprador = 5.
    unwrap(addCartItem('user_alice', { nftId: 'nft_002', editionType: 'ABERTA', quantity: 2 }))
    const merged = unwrap(
      addCartItem('user_alice', { nftId: 'nft_002', editionType: 'ABERTA', quantity: 2 }),
    )
    expect(merged.items).toHaveLength(3)
    expect(merged.items.find((item) => item.editionType === 'ABERTA')?.quantity).toBe(4)

    const error = failure(
      addCartItem('user_alice', { nftId: 'nft_002', editionType: 'ABERTA', quantity: 2 }),
    )
    expect(error.code).toBe('AVAILABILITY_CONFLICT')
  })

  it('blocks sold-out editions and editions already at the limit', () => {
    // nft_001 1/1 está esgotado (disponibilidade 0).
    expect(
      failure(addCartItem('user_alice', { nftId: 'nft_001', editionType: '1/1', quantity: 1 })).code,
    ).toBe('AVAILABILITY_CONFLICT')

    // Alice já tem nft_003 1/1 (limite 1).
    expect(
      failure(addCartItem('user_alice', { nftId: 'nft_003', editionType: '1/1', quantity: 1 })).code,
    ).toBe('AVAILABILITY_CONFLICT')

    expect(
      failure(addCartItem('user_alice', { nftId: 'nao_existe', editionType: '1/1', quantity: 1 })).code,
    ).toBe('NOT_FOUND')
  })

  it('updates, removes and clears items respecting ownership', () => {
    expect(failure(updateCartItem('user_alice', 'cart_bob_001', { quantity: 1 })).code).toBe('FORBIDDEN')
    expect(failure(updateCartItem('user_alice', 'item_inexistente', { quantity: 1 })).code).toBe('NOT_FOUND')

    // cart_alice_001: nft_002 1/10, limite 2.
    expect(unwrap(updateCartItem('user_alice', 'cart_alice_001', { quantity: 1 })).items[0].quantity).toBe(1)
    expect(failure(updateCartItem('user_alice', 'cart_alice_001', { quantity: 3 })).code).toBe(
      'AVAILABILITY_CONFLICT',
    )

    expect(unwrap(removeCartItem('user_alice', 'cart_alice_001')).items).toHaveLength(1)
    expect(failure(removeCartItem('user_alice', 'cart_bob_001')).code).toBe('FORBIDDEN')

    unwrap(clearCart('user_alice'))
    expect(unwrap(getCart('user_alice')).items).toHaveLength(0)
    expect(unwrap(getCart('user_bob')).items).toHaveLength(2)
  })
})

describe('wallets', () => {
  it('lists the primary wallet first and keeps a single primary', () => {
    const wallets = unwrap(listWallets('user_alice'))
    expect(wallets[0].id).toBe('wallet_alice_primary')

    const created = unwrap(
      createWallet('user_alice', {
        nickname: 'Nova',
        network: 'Polygon',
        address: `0x${'ab'.repeat(20)}`,
        type: 'MetaMask',
        ensName: 'nova.eth',
        isPrimary: true,
      }),
    )
    expect(created.isPrimary).toBe(true)

    const after = unwrap(listWallets('user_alice'))
    expect(after.filter((wallet) => wallet.isPrimary)).toHaveLength(1)
    expect(after[0].id).toBe(created.id)
  })

  it('rejects duplicate addresses and foreign wallets', () => {
    const existing = unwrap(listWallets('user_alice'))[0]
    const error = failure(
      createWallet('user_alice', {
        nickname: 'Duplicada',
        network: 'Ethereum',
        address: existing.address,
        type: 'MetaMask',
      }),
    )
    expect(error.fieldErrors?.[0].field).toBe('address')

    expect(failure(updateWallet('user_alice', 'wallet_bob_primary', { nickname: 'x' })).code).toBe('FORBIDDEN')
    expect(failure(updateWallet('user_alice', 'wallet_nao_existe', { nickname: 'x' })).code).toBe('NOT_FOUND')
  })

  it('does not allow unsetting the only primary wallet', () => {
    const error = failure(updateWallet('user_alice', 'wallet_alice_primary', { isPrimary: false }))
    expect(error.code).toBe('VALIDATION_ERROR')
  })

  it('connects and disconnects a wallet', () => {
    expect(unwrap(setWalletConnection('user_alice', 'wallet_alice_primary', true)).connected).toBe(true)
    expect(unwrap(setWalletConnection('user_alice', 'wallet_alice_primary', false)).connected).toBe(false)
    expect(failure(setWalletConnection('user_alice', 'wallet_bob_primary', true)).code).toBe('FORBIDDEN')
  })
})

describe('profile', () => {
  it('updates fields, removes the avatar and rejects a taken userName', () => {
    expect(unwrap(updateProfile('user_alice', { displayName: 'Alice Atualizada' })).displayName).toBe(
      'Alice Atualizada',
    )

    const removed = unwrap(updateProfile('user_alice', { avatar: null }))
    expect(removed.avatar).toBeUndefined()
    expect(unwrap(getProfile('user_alice')).avatar).toBeUndefined()

    const error = failure(updateProfile('user_alice', { userName: 'bob_mendes' }))
    expect(error.fieldErrors?.[0].field).toBe('userName')
  })

  it('rejects invalid avatar files before reading them', async () => {
    const wrongType = new File(['x'], 'a.txt', { type: 'text/plain' })
    expect(failure(await uploadAvatar('user_alice', wrongType)).fieldErrors?.[0].field).toBe('avatar')

    const tooBig = new File([new Uint8Array(AVATAR_MAX_BYTES + 1)], 'big.png', { type: 'image/png' })
    expect(failure(await uploadAvatar('user_alice', tooBig)).fieldErrors?.[0].field).toBe('avatar')
  })

  it('changes the password only with the correct current one', async () => {
    const auth = unwrap(await login({ email: 'alice@nft.test', password: 'Alice@123' }))

    const wrong = failure(
      await changePassword('user_alice', auth.session.id, {
        currentPassword: 'errada',
        newPassword: 'NovaSenha@456',
      }),
    )
    expect(wrong.fieldErrors?.[0].field).toBe('currentPassword')

    unwrap(
      await changePassword('user_alice', auth.session.id, {
        currentPassword: 'Alice@123',
        newPassword: 'NovaSenha@456',
      }),
    )

    expect(failure(await login({ email: 'alice@nft.test', password: 'Alice@123' })).code).toBe(
      'UNAUTHENTICATED',
    )
    unwrap(await login({ email: 'alice@nft.test', password: 'NovaSenha@456' }))
  })
})
