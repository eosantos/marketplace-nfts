import { describe, expect, it } from 'vitest'
import type { SocketEvent } from '@/shared/contracts'
import { EventLedger } from './ledger'

const event = (id: string, version: number, resourceId = 'nft_002', resource: 'nft' | 'order' = 'nft'): SocketEvent => ({
  id,
  type: resource === 'nft' ? 'nft.updated' : 'order.updated',
  resource,
  resourceId,
  version,
  payload: {},
})

describe('EventLedger', () => {
  it('accepts a new version once and drops the duplicate by id', () => {
    const ledger = new EventLedger()
    const first = event('evt_1', 1)
    expect(ledger.accept(first)).toBe(true)
    expect(ledger.accept(first)).toBe(false)
  })

  it('drops old and equal versions of the same resource but not other resources', () => {
    const ledger = new EventLedger()
    expect(ledger.accept(event('evt_1', 3))).toBe(true)
    expect(ledger.accept(event('evt_2', 2))).toBe(false)
    expect(ledger.accept(event('evt_3', 3))).toBe(false)
    expect(ledger.accept(event('evt_4', 4))).toBe(true)
    expect(ledger.accept(event('evt_5', 1, 'nft_003'))).toBe(true)
    expect(ledger.accept(event('evt_6', 1, 'order_1', 'order'))).toBe(true)
  })

  it('never lets a late pending event regress a terminal order', () => {
    const ledger = new EventLedger()
    expect(ledger.accept(event('evt_1', 2, 'order_1', 'order'))).toBe(true)
    expect(ledger.accept(event('evt_2', 1, 'order_1', 'order'))).toBe(false)
  })

  it('evicts the oldest ids beyond its capacity and can be reset', () => {
    const ledger = new EventLedger(2)
    ledger.accept(event('evt_1', 1, 'a'))
    ledger.accept(event('evt_2', 1, 'b'))
    ledger.accept(event('evt_3', 1, 'c'))
    // evt_1 saiu do conjunto de ids vistos; a versão do recurso continua protegendo contra reaplicação.
    expect(ledger.accept(event('evt_1', 1, 'a'))).toBe(false)

    ledger.reset()
    expect(ledger.accept(event('evt_1', 1, 'a'))).toBe(true)
  })
})
