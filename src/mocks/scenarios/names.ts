// Nomes canônicos dos cenários de mock.
// As respostas determinísticas são implementadas nas etapas 06/07; aqui ficam
// os identificadores usados pelo banco, pelo env e pelos handlers futuros.

import { z } from 'zod'

export const MOCK_SCENARIOS = [
  'default',
  'empty',
  'slow-random-latency',
  'out-of-order',
  'network-failure',
  'http-4xx',
  'http-5xx',
  'session-expired',
  'signup-conflict',
  'coupon-invalid',
  'coupon-expired',
  'price-changed-at-checkout',
  'sold-out-at-checkout',
  'timeout-after-order-created',
  'payment-confirmed',
  'payment-refused',
] as const

export type MockScenario = (typeof MOCK_SCENARIOS)[number]

export const MockScenarioSchema = z.enum(MOCK_SCENARIOS)

export const DEFAULT_MOCK_SCENARIO: MockScenario = 'default'

export function isMockScenario(value: unknown): value is MockScenario {
  return typeof value === 'string' && (MOCK_SCENARIOS as readonly string[]).includes(value)
}

export function resolveMockScenario(value: string | undefined): MockScenario {
  return isMockScenario(value) ? value : DEFAULT_MOCK_SCENARIO
}
