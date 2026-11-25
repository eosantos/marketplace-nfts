import { beforeEach, describe, expect, it } from 'vitest'
import type { NftUpdatedPayload, OrderUpdatedPayload, SocketEvent } from '@/shared/contracts'
import { getDb, mutateDb, resetDb } from '../db'
import { RealtimeHub, STALE_PRICE, type HubClient } from './hub'
import { createOrderFixture } from './order-fixture'

interface Received {
  event: string
  payload: unknown
}

function fakeClient(): HubClient & { received: Received[]; closed: boolean } {
  const client = {
    received: [] as Received[],
    closed: false,
    send: (event: string, payload: unknown) => {
      client.received.push({ event, payload })
    },
    close: () => {
      client.closed = true
    },
  }
  return client
}

const envelopes = (client: { received: Received[] }, type: string): SocketEvent[] =>
  client.received.filter((item) => item.event === type).map((item) => item.payload as SocketEvent)

function addSession(userId: string, token: string, expiresAt = '2099-01-01T00:00:00.000Z'): void {
  mutateDb((db) => {
    db.sessions.push({ id: `sess_${token}`, userId, token, expiresAt })
  })
}

function connected(hub: RealtimeHub, token: string | null) {
  const client = fakeClient()
  hub.connect(client)
  hub.authenticate(client, { token })
  return client
}

beforeEach(() => {
  resetDb('default')
  addSession('user_alice', 'tok_alice')
  addSession('user_bob', 'tok_bob')
})

describe('authentication', () => {
  it('binds a valid session to the connection and rejects bad, missing and expired tokens', () => {
    const hub = new RealtimeHub()
    expect(connected(hub, 'tok_alice').received).toEqual([{ event: 'authenticated', payload: { userId: 'user_alice' } }])

    expect(connected(hub, 'tok_inexistente').received[0].event).toBe('auth_error')
    expect(connected(hub, null).received[0].event).toBe('auth_error')

    addSession('user_alice', 'tok_velho', '2020-01-01T00:00:00.000Z')
    expect(connected(hub, 'tok_velho').received[0].event).toBe('auth_error')
    expect(hub.stats()).toEqual({ connected: 4, authenticated: 1 })
  })
})

describe('nft.updated', () => {
  it('reaches every authenticated connection and never an unauthenticated one', () => {
    const hub = new RealtimeHub()
    const alice = connected(hub, 'tok_alice')
    const bob = connected(hub, 'tok_bob')
    const anonymous = connected(hub, 'tok_inexistente')

    hub.handleDbEvent({ type: 'nft.updated', nftId: 'nft_002' })

    expect(envelopes(alice, 'nft.updated')).toHaveLength(1)
    expect(envelopes(bob, 'nft.updated')).toHaveLength(1)
    expect(envelopes(anonymous, 'nft.updated')).toHaveLength(0)

    const [envelope] = envelopes(alice, 'nft.updated')
    const payload = envelope.payload as NftUpdatedPayload
    expect(envelope.resource).toBe('nft')
    expect(envelope.resourceId).toBe('nft_002')
    expect(payload.price).toBe(getDb().nfts[1].price)
    expect(payload.editions).toHaveLength(4)
  })

  it('increments the version per resource and uses unique event ids', () => {
    const hub = new RealtimeHub()
    const alice = connected(hub, 'tok_alice')

    hub.handleDbEvent({ type: 'nft.updated', nftId: 'nft_002' })
    hub.handleDbEvent({ type: 'nft.updated', nftId: 'nft_002' })
    hub.handleDbEvent({ type: 'nft.updated', nftId: 'nft_003' })

    const list = envelopes(alice, 'nft.updated')
    expect(list.map((item) => `${item.resourceId}:v${item.version}`)).toEqual(['nft_002:v1', 'nft_002:v2', 'nft_003:v1'])
    expect(new Set(list.map((item) => item.id)).size).toBe(3)
  })

  it('stays silent for unknown nfts', () => {
    const hub = new RealtimeHub()
    const alice = connected(hub, 'tok_alice')
    hub.handleDbEvent({ type: 'nft.updated', nftId: 'nao_existe' })
    expect(hub.emitNft('nao_existe')).toBeNull()
    expect(envelopes(alice, 'nft.updated')).toHaveLength(0)
  })
})

describe('controlled emission (duplicate and stale)', () => {
  it('re-sends the same event id when asked for a duplicate', () => {
    const hub = new RealtimeHub()
    const alice = connected(hub, 'tok_alice')
    hub.emitNft('nft_002', { duplicate: true })

    const list = envelopes(alice, 'nft.updated')
    expect(list).toHaveLength(2)
    expect(list[0].id).toBe(list[1].id)
  })

  it('follows with an older version carrying a wrong price when asked for a stale event', () => {
    const hub = new RealtimeHub()
    const alice = connected(hub, 'tok_alice')
    hub.emitNft('nft_002')
    hub.emitNft('nft_002', { stale: true })

    const list = envelopes(alice, 'nft.updated')
    expect(list.map((item) => item.version)).toEqual([1, 2, 1])
    expect((list[2].payload as NftUpdatedPayload).price).toBe(STALE_PRICE)
  })
})

describe('order.updated', () => {
  it('goes only to the owner and carries a terminal version above pending', () => {
    const hub = new RealtimeHub()
    const alice = connected(hub, 'tok_alice')
    const bob = connected(hub, 'tok_bob')
    const { orderId } = createOrderFixture('user_alice')

    hub.handleDbEvent({ type: 'order.updated', orderId, userId: 'user_alice', status: 'pending' })
    mutateDb((db) => {
      const order = db.orders.find((item) => item.id === orderId)
      if (order) {
        order.status = 'confirmed'
        order.txRef = `0x${'a'.repeat(64)}`
      }
    })
    hub.handleDbEvent({ type: 'order.updated', orderId, userId: 'user_alice', status: 'confirmed' })

    expect(envelopes(bob, 'order.updated')).toHaveLength(0)
    const list = envelopes(alice, 'order.updated')
    expect(list.map((item) => item.version)).toEqual([1, 2])
    expect(list[1].userId).toBe('user_alice')
    expect((list[1].payload as OrderUpdatedPayload).status).toBe('confirmed')
    expect((list[1].payload as OrderUpdatedPayload).txRef).toBe(`0x${'a'.repeat(64)}`)
  })
})

describe('connection lifecycle', () => {
  it('stops delivering after a disconnect and drops every connection on demand', () => {
    const hub = new RealtimeHub()
    const alice = connected(hub, 'tok_alice')
    const bob = connected(hub, 'tok_bob')

    hub.disconnect(alice)
    hub.handleDbEvent({ type: 'nft.updated', nftId: 'nft_002' })
    expect(envelopes(alice, 'nft.updated')).toHaveLength(0)
    expect(envelopes(bob, 'nft.updated')).toHaveLength(1)

    expect(hub.dropAll()).toBe(1)
    expect(bob.closed).toBe(true)
  })
})
