// Controle dos mocks: reset e troca de cenário (HTTP em /__mocks__/* e window.__mocks).
// Os testes E2E usam estas funções; nunca a UI nem o cache diretamente.

import { getDb, mutateDb, resetDb } from './db'
import { reseedLatency } from './scenarios/latency'
import { realtimeHub } from './socket/hub'
import { MockScenarioSchema, type MockScenario } from './scenarios/names'
import type { EthAmount, NftEditionType } from '@/shared/contracts'

export interface MockState {
  scenario: MockScenario
  users: number
  sessions: number
  nfts: number
  orders: number
}

export function getMockState(): MockState {
  const db = getDb()
  return {
    scenario: db.scenario,
    users: db.users.length,
    sessions: db.sessions.length,
    nfts: db.nfts.length,
    orders: db.orders.length,
  }
}

/** Restaura integralmente um cenário (padrão: `default`). */
export function resetMocks(scenario?: string): MockState {
  resetDb(scenario)
  reseedLatency()
  return getMockState()
}

/** Troca o cenário ativo mantendo os dados atuais. */
export function setMockScenario(scenario: string): MockState {
  const parsed = MockScenarioSchema.safeParse(scenario)
  if (!parsed.success) {
    throw new Error(
      `Cenário inválido: "${scenario}". Válidos: ${MockScenarioSchema.options.join(', ')}`,
    )
  }
  mutateDb((db) => {
    db.scenario = parsed.data
  })
  reseedLatency()
  return getMockState()
}

export interface EmitNftOptions {
  nftId: string
  /** Novo preço (string decimal). */
  price?: EthAmount
  /** Nova disponibilidade de uma edição. */
  available?: { edition: NftEditionType; value: number }
  duplicate?: boolean
  stale?: boolean
}

/**
 * Altera o NFT NO BANCO e emite o evento pelo servidor Socket.IO simulado: REST e socket sempre
 * concordam. `duplicate` reenvia o mesmo evento; `stale` envia em seguida um evento antigo.
 */
export function emitNftChange(options: EmitNftOptions): MockState {
  mutateDb((db) => {
    const nft = db.nfts.find((candidate) => candidate.id === options.nftId)
    if (!nft) throw new Error(`NFT não encontrado: ${options.nftId}`)

    if (options.price) nft.price = options.price
    if (options.available) {
      const edition = nft.editions.find((candidate) => candidate.type === options.available?.edition)
      if (!edition) throw new Error(`Edição não encontrada: ${options.available.edition}`)
      edition.available = options.available.value
    }
    nft.updatedAt = new Date().toISOString()
  })

  realtimeHub.emitNft(options.nftId, {
    ...(options.duplicate ? { duplicate: true } : {}),
    ...(options.stale ? { stale: true } : {}),
  })
  return getMockState()
}

/** Derruba as conexões Socket.IO (os clientes reconectam e reconciliam). Retorna quantas caíram. */
export function dropSocketConnections(): number {
  return realtimeHub.dropAll()
}

export function getSocketState(): { connected: number; authenticated: number } {
  return realtimeHub.stats()
}

export interface MocksControl {
  reset: (scenario?: string) => MockState
  setScenario: (scenario: string) => MockState
  getState: () => MockState
  emitNft: (options: EmitNftOptions) => MockState
  dropSocket: () => number
  socketState: () => { connected: number; authenticated: number }
}

declare global {
  interface Window {
    __mocks?: MocksControl
  }
}

/** Expõe window.__mocks. Só é chamado quando os mocks estão ativos. */
export function installWindowControl(): void {
  window.__mocks = {
    reset: resetMocks,
    setScenario: setMockScenario,
    getState: getMockState,
    emitNft: emitNftChange,
    dropSocket: dropSocketConnections,
    socketState: getSocketState,
  }
}
