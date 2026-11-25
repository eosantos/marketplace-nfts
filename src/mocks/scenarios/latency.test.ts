import { beforeEach, describe, expect, it } from 'vitest'
import { mutateDb, resetDb } from '../db'
import { createRng, hashString } from '../util/prng'
import { couponScenarioStatus, DEFAULT_LATENCY_MS, latencyFor, reseedLatency } from './latency'
import type { MockScenario } from './names'

function use(scenario: MockScenario): void {
  mutateDb((db) => {
    db.scenario = scenario
  })
  reseedLatency()
}

beforeEach(() => {
  resetDb('default')
  reseedLatency()
})

describe('prng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    expect(hashString('/api/nfts?q=ape')).toBe(hashString('/api/nfts?q=ape'))
  })
})

describe('latency per scenario', () => {
  it('uses a fixed latency by default', () => {
    expect(latencyFor('/api/nfts')).toBe(DEFAULT_LATENCY_MS)
  })

  it('reproduces the slow-random-latency sequence after a reseed', () => {
    use('slow-random-latency')
    const first = [latencyFor('/a'), latencyFor('/b'), latencyFor('/c')]
    expect(first.every((ms) => ms >= 400 && ms <= 2600)).toBe(true)

    reseedLatency()
    expect([latencyFor('/a'), latencyFor('/b'), latencyFor('/c')]).toEqual(first)
  })

  it('makes out-of-order depend only on the url', () => {
    use('out-of-order')
    expect(latencyFor('/api/nfts?q=a')).toBe(latencyFor('/api/nfts?q=a'))
    const delays = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((q) => latencyFor(`/api/nfts?q=${q}`)))
    expect(delays.size).toBeGreaterThan(1)
  })
})

describe('coupon scenarios', () => {
  it('forces invalid and expired coupon statuses', () => {
    expect(couponScenarioStatus()).toBeNull()
    use('coupon-invalid')
    expect(couponScenarioStatus()).toBe('invalid')
    use('coupon-expired')
    expect(couponScenarioStatus()).toBe('expired')
  })
})
