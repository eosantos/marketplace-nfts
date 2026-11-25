// Controle dos mocks: reset e troca de cenário (HTTP em /__mocks__/* e window.__mocks).
// Os testes E2E usam estas funções; nunca a UI nem o cache diretamente.

import { getDb, mutateDb, resetDb } from './db'
import { reseedLatency } from './scenarios/latency'
import { MockScenarioSchema, type MockScenario } from './scenarios/names'

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

export interface MocksControl {
  reset: (scenario?: string) => MockState
  setScenario: (scenario: string) => MockState
  getState: () => MockState
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
  }
}
