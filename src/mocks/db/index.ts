// Banco simulado único do MSW, persistido em localStorage com chave versionada.
// Handlers REST (etapa 06 em diante) e eventos Socket.IO leem/escrevem daqui.

import {
  DEFAULT_MOCK_SCENARIO,
  isMockScenario,
  resolveMockScenario,
  type MockScenario,
} from '../scenarios/names'
import { MOCK_DB_SCHEMA_VERSION, MOCK_DB_STORAGE_KEY } from './constants'
import { createSeedState } from './seed'
import type { MockDb } from './types'

export { MOCK_DB_SCHEMA_VERSION, MOCK_DB_STORAGE_KEY } from './constants'
export { createSeedState } from './seed'
export type {
  MockCoupon,
  MockDb,
  MockIdempotencyRecord,
  MockQuote,
  MockSequences,
  MockUserRecord,
} from './types'

let memoryDb: MockDb | null = null

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    return window.localStorage
  } catch {
    return null
  }
}

function isPersistedDb(value: unknown): value is MockDb {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<MockDb>
  return (
    candidate.schemaVersion === MOCK_DB_SCHEMA_VERSION &&
    isMockScenario(candidate.scenario) &&
    Array.isArray(candidate.users) &&
    Array.isArray(candidate.nfts) &&
    Array.isArray(candidate.carts) &&
    Array.isArray(candidate.wallets) &&
    Array.isArray(candidate.orders)
  )
}

function readPersistedDb(): MockDb | null {
  const storage = getStorage()
  if (!storage) return null

  try {
    const raw = storage.getItem(MOCK_DB_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isPersistedDb(parsed) ? parsed : null
  } catch {
    return null
  }
}

function persistDb(db: MockDb): void {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Sem localStorage (modo privado/quota): mantém apenas o estado em memória.
  }
}

/** Carrega o banco (memória → localStorage → seed padrão). */
export function loadDb(): MockDb {
  if (memoryDb) return memoryDb

  const persisted = readPersistedDb()
  if (persisted) {
    memoryDb = persisted
    return persisted
  }

  const seed = createSeedState(DEFAULT_MOCK_SCENARIO)
  memoryDb = seed
  persistDb(seed)
  return seed
}

/** Alias de `loadDb` para leitura. */
export function getDb(): MockDb {
  return loadDb()
}

/** Persiste um estado completo (usado após mutations dos handlers). */
export function saveDb(db: MockDb): void {
  memoryDb = db
  persistDb(db)
}

/** Aplica uma mutation no banco e persiste o resultado. */
export function mutateDb<T>(mutator: (db: MockDb) => T): T {
  const db = loadDb()
  const result = mutator(db)
  persistDb(db)
  return result
}

/**
 * Restaura integralmente um cenário conhecido.
 * Nomes inválidos caem no cenário `default`.
 */
export function resetDb(scenario: string | undefined = DEFAULT_MOCK_SCENARIO): MockDb {
  const resolved = resolveMockScenario(scenario)
  const seed = createSeedState(resolved)
  saveDb(seed)
  return seed
}

/** Cenário atualmente ativo. */
export function getActiveScenario(): MockScenario {
  return loadDb().scenario
}

/** Apenas para testes: descarta o cache em memória sem tocar no localStorage. */
export function clearMemoryDb(): void {
  memoryDb = null
}
