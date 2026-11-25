import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it } from 'vitest'
import { getDb, mutateDb, resetDb } from '@/mocks/db'
import { RealtimeHub, STALE_PRICE, type HubClient } from '@/mocks/socket/hub'
import { createOrderFixture } from '@/mocks/socket/order-fixture'
import { qk } from '@/shared/api/query-keys'
import type { Nft, Order, SocketEvent } from '@/shared/contracts'
import { RealtimeManager, type SocketLike } from './manager'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Socket em memória ligado ao hub real: sem rede, mas com o mesmo protocolo de eventos. */
class FakeSocket implements SocketLike {
  private readonly handlers = new Map<string, Array<(...args: unknown[]) => void>>()
  private readonly hubClient: HubClient
  private wanted = true

  constructor(private readonly hub: RealtimeHub) {
    this.hubClient = {
      send: (event, payload) => {
        this.dispatch(event, payload)
      },
      close: () => {
        this.hub.disconnect(this.hubClient)
        this.dispatch('disconnect', 'transport close')
        // O socket.io-client reconecta sozinho; aqui, depois de 5 ms.
        setTimeout(() => {
          if (this.wanted) this.open()
        }, 5)
      },
    }
  }

  on(event: string, listener: (...args: unknown[]) => void): void {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), listener])
  }

  emit(event: string, ...args: unknown[]): void {
    if (event === 'authenticate') this.hub.authenticate(this.hubClient, args[0])
  }

  connect(): void {
    this.open()
  }

  disconnect(): void {
    this.wanted = false
    this.hub.disconnect(this.hubClient)
  }

  /** Injeta um evento cru como se viesse do servidor (para testar as defesas do cliente). */
  inject(event: string, payload: unknown): void {
    this.dispatch(event, payload)
  }

  private open(): void {
    this.hub.connect(this.hubClient)
    queueMicrotask(() => {
      this.dispatch('connect')
    })
  }

  private dispatch(event: string, ...args: unknown[]): void {
    for (const listener of this.handlers.get(event) ?? []) listener(...args)
  }
}

function addSession(userId: string, token: string): void {
  mutateDb((db) => {
    db.sessions.push({ id: `sess_${token}`, userId, token, expiresAt: '2099-01-01T00:00:00.000Z' })
  })
}

function setup(token: string | null = 'tok_alice') {
  const hub = new RealtimeHub()
  const queryClient = new QueryClient()
  const invalidated: string[] = []
  const original = queryClient.invalidateQueries.bind(queryClient)
  queryClient.invalidateQueries = (filters, options) => {
    invalidated.push(JSON.stringify(filters?.queryKey))
    return original(filters, options)
  }

  const state = { token }
  let socket: FakeSocket | null = null
  const manager = new RealtimeManager({
    queryClient,
    getToken: () => state.token,
    createSocket: () => {
      socket = new FakeSocket(hub)
      return socket
    },
  })
  return { hub, queryClient, invalidated, state, manager, socket: () => socket }
}

const target = (): Nft => getDb().nfts[1]

beforeEach(() => {
  resetDb('default')
  addSession('user_alice', 'tok_alice')
  addSession('user_bob', 'tok_bob')
})

describe('RealtimeManager', () => {
  it('connects only with a session and authenticates by event', async () => {
    const none = setup(null)
    none.manager.syncWithSession()
    expect(none.manager.getStatus()).toBe('disconnected')

    const ctx = setup('tok_alice')
    ctx.manager.syncWithSession()
    expect(ctx.manager.getStatus()).toBe('connecting')
    await wait(5)
    expect(ctx.manager.getStatus()).toBe('connected')
    expect(ctx.hub.stats()).toEqual({ connected: 1, authenticated: 1 })
  })

  it('applies nft updates to the cache once, ignoring duplicates and stale versions', async () => {
    const ctx = setup()
    ctx.queryClient.setQueryData(qk.nft(target().id), structuredClone(target()))
    ctx.manager.syncWithSession()
    await wait(5)

    mutateDb((db) => {
      db.nfts[1].price = '1.50'
    })
    ctx.hub.emitNft(target().id, { duplicate: true, stale: true })

    const cached = ctx.queryClient.getQueryData<Nft>(qk.nft(target().id))
    expect(cached?.price).toBe('1.50')
    expect(cached?.price).not.toBe(STALE_PRICE)
  })

  it('ignores events addressed to another user even if they reach the socket', async () => {
    const ctx = setup()
    ctx.queryClient.setQueryData(qk.order('user_alice', 'order_1'), { id: 'order_1', status: 'pending' })
    ctx.manager.syncWithSession()
    await wait(5)

    const foreign: SocketEvent = {
      id: 'evt_x',
      type: 'order.updated',
      resource: 'order',
      resourceId: 'order_1',
      version: 2,
      userId: 'user_bob',
      payload: { orderId: 'order_1', status: 'confirmed', updatedAt: '2026-11-25T12:00:00.000Z' },
    }
    ctx.socket()?.inject('order.updated', foreign)
    expect(ctx.queryClient.getQueryData<Order>(qk.order('user_alice', 'order_1'))?.status).toBe('pending')
  })

  it('delivers order events from the real db bus to the owner', async () => {
    const ctx = setup('tok_alice')
    ctx.manager.syncWithSession()
    await wait(5)

    const { orderId } = createOrderFixture('user_alice')
    ctx.queryClient.setQueryData(qk.order('user_alice', orderId), { id: orderId, status: 'pending' })
    mutateDb((db) => {
      const order = db.orders.find((item) => item.id === orderId)
      if (order) order.status = 'confirmed'
    })
    ctx.hub.handleDbEvent({ type: 'order.updated', orderId, userId: 'user_alice', status: 'confirmed' })

    expect(ctx.queryClient.getQueryData<Order>(qk.order('user_alice', orderId))?.status).toBe('confirmed')
  })

  it('reconnects after a drop and reconciles active data through REST exactly once', async () => {
    const ctx = setup()
    ctx.manager.syncWithSession()
    await wait(5)
    expect(ctx.invalidated).toHaveLength(0) // a primeira conexão não reconcilia

    expect(ctx.hub.dropAll()).toBe(1)
    expect(ctx.manager.getStatus()).toBe('reconnecting')

    await wait(30)
    expect(ctx.manager.getStatus()).toBe('connected')
    expect(ctx.invalidated.filter((key) => key === JSON.stringify(['quote', 'user_alice']))).toHaveLength(1)
    expect(ctx.invalidated).toContain(JSON.stringify(['nfts']))
    expect(ctx.invalidated).toContain(JSON.stringify(['cart', 'user_alice']))
    expect(ctx.invalidated).toContain(JSON.stringify(['order', 'user_alice']))
  })

  it('misses events emitted during the outage (and relies on the reconciliation to recover them)', async () => {
    const ctx = setup()
    const original = target().price
    ctx.queryClient.setQueryData(qk.nft(target().id), structuredClone(target()))
    ctx.manager.syncWithSession()
    await wait(5)

    ctx.hub.dropAll()
    mutateDb((db) => {
      db.nfts[1].price = '2.00'
    })
    ctx.hub.emitNft(target().id) // ninguém conectado: o evento se perde
    expect(ctx.queryClient.getQueryData<Nft>(qk.nft(target().id))?.price).toBe(original)

    await wait(30)
    expect(ctx.invalidated).toContain(JSON.stringify(['nfts'])) // o REST refaz o que ficou para trás
  })

  it('disconnects on logout, forgets the ledger and stops receiving', async () => {
    const ctx = setup()
    ctx.queryClient.setQueryData(qk.nft(target().id), structuredClone(target()))
    ctx.manager.syncWithSession()
    await wait(5)

    ctx.state.token = null
    ctx.manager.syncWithSession()
    expect(ctx.manager.getStatus()).toBe('disconnected')
    expect(ctx.hub.stats().connected).toBe(0)

    mutateDb((db) => {
      db.nfts[1].price = '7.77'
    })
    ctx.hub.emitNft(target().id)
    expect(ctx.queryClient.getQueryData<Nft>(qk.nft(target().id))?.price).not.toBe('7.77')
  })

  it('stops insisting when the server rejects the session', async () => {
    const ctx = setup('tok_invalido')
    ctx.manager.syncWithSession()
    await wait(5)
    expect(ctx.manager.getStatus()).toBe('disconnected')
    expect(ctx.hub.stats().authenticated).toBe(0)
  })

  it('notifies status subscribers', async () => {
    const ctx = setup()
    const seen: string[] = []
    ctx.manager.subscribe(() => {
      seen.push(ctx.manager.getStatus())
    })
    ctx.manager.syncWithSession()
    await wait(5)
    ctx.manager.disconnect()
    expect(seen).toEqual(['connecting', 'connected', 'disconnected'])
  })
})
