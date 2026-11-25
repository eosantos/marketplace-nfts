// Regras puras de latência e cupom por cenário (sem dependência do msw).

import { getActiveScenario } from '../db'
import { createRng, hashString } from '../util/prng'

export const DEFAULT_LATENCY_MS = 180
const LATENCY_SEED = 20260725

let latencyRng = createRng(LATENCY_SEED)

/** Reinicia a sequência pseudoaleatória (reset e troca de cenário). */
export function reseedLatency(): void {
  latencyRng = createRng(LATENCY_SEED)
}

export function latencyFor(url: string): number {
  switch (getActiveScenario()) {
    case 'slow-random-latency':
      // 400–2600 ms, sequência reproduzível a partir da seed.
      return 400 + Math.round(latencyRng() * 2200)
    case 'out-of-order':
      // O atraso depende da URL: buscas diferentes terminam fora da ordem de envio.
      return 80 + (hashString(url) % 6) * 450
    default:
      return DEFAULT_LATENCY_MS
  }
}

/** Status de cupom imposto pelo cenário (usado pela cotação na parte 2b). */
export function couponScenarioStatus(): 'invalid' | 'expired' | null {
  const scenario = getActiveScenario()
  if (scenario === 'coupon-invalid') return 'invalid'
  if (scenario === 'coupon-expired') return 'expired'
  return null
}
