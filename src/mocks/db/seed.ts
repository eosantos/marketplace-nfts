// Cria o estado inicial determinístico de um cenário.
// Apenas `default` e `empty` alteram os dados nesta etapa; os demais cenários
// compartilham o seed padrão e serão consumidos pelo pipeline REST/socket nas
// etapas 06/07.

import type { Cart } from '@/shared/contracts'
import {
  cartFixtures,
  couponFixtures,
  favoriteFixtures,
  nftFixtures,
  userFixtures,
  walletFixtures,
} from '../fixtures'
import type { MockScenario } from '../scenarios/names'
import { MOCK_DB_SCHEMA_VERSION } from './constants'
import type { MockDb } from './types'

const EMPTY_SCENARIO_UPDATED_AT = '2026-07-01T00:00:00.000Z'

function clone<T>(value: T): T {
  return structuredClone(value)
}

function buildCarts(scenario: MockScenario): Cart[] {
  const carts = scenario === 'empty' ? [] : clone(cartFixtures)

  for (const user of userFixtures) {
    if (!carts.some((cart) => cart.userId === user.id)) {
      carts.push({
        userId: user.id,
        items: [],
        updatedAt: EMPTY_SCENARIO_UPDATED_AT,
      })
    }
  }

  return carts
}

export function createSeedState(scenario: MockScenario): MockDb {
  const isEmpty = scenario === 'empty'

  return {
    schemaVersion: MOCK_DB_SCHEMA_VERSION,
    scenario,
    users: clone(userFixtures),
    sessions: [],
    nfts: isEmpty ? [] : clone(nftFixtures),
    favorites: isEmpty ? [] : clone(favoriteFixtures),
    carts: buildCarts(scenario),
    wallets: clone(walletFixtures),
    coupons: clone(couponFixtures),
    quotes: [],
    orders: [],
    idempotency: {},
    sequences: { order: 0, quote: 0, session: 0, wallet: 0 },
  }
}
