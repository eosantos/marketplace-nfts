// Servidor Socket.IO simulado, sem dependência do MSW (a cola com o binding fica em handler.ts).
// Lê/escreve do MESMO banco usado pelo REST: o evento e a resposta REST sempre concordam.
//
// Regras: só conexões autenticadas recebem eventos; `nft.updated` vai para todas elas e
// `order.updated` somente para o dono do pedido (o envelope leva `userId`).

import type { NftUpdatedPayload, OrderUpdatedPayload, SocketEvent } from '@/shared/contracts'
import { getDb } from '../db'
import type { MockDbEvent } from '../events'

export interface HubClient {
  /** Entrega um evento da aplicação ao cliente (no wire: um pacote Socket.IO EVENT). */
  send: (event: string, payload: unknown) => void
  /** Encerra o transporte (simula queda); o socket.io-client reconecta sozinho. */
  close: () => void
}

export interface EmitOptions {
  /** Reenvia o MESMO evento (mesmo id): o cliente deve aplicar uma vez só. */
  duplicate?: boolean
  /** Envia em seguida um evento antigo (versão menor, preço errado): o cliente deve ignorar. */
  stale?: boolean
}

export const STALE_PRICE = '99.99'

interface ClientState {
  userId: string | null
}

function readToken(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null
  const token = (payload as Record<string, unknown>).token
  return typeof token === 'string' ? token : null
}

export class RealtimeHub {
  private readonly clients = new Map<HubClient, ClientState>()
  private readonly versions = new Map<string, number>()
  private sequence = 0

  connect(client: HubClient): void {
    this.clients.set(client, { userId: null })
  }

  disconnect(client: HubClient): void {
    this.clients.delete(client)
  }

  /** Valida o token da sessão (evento `authenticate`) e vincula a conexão ao usuário. */
  authenticate(client: HubClient, payload: unknown): void {
    const state = this.clients.get(client)
    if (!state) return

    const token = readToken(payload)
    const session = token ? getDb().sessions.find((candidate) => candidate.token === token) : undefined

    if (!session || Date.parse(session.expiresAt) <= Date.now()) {
      client.send('auth_error', { message: 'Sessão inválida ou expirada.' })
      return
    }

    state.userId = session.userId
    client.send('authenticated', { userId: session.userId })
  }

  /** Ponte do barramento de eventos do banco (src/mocks/events.ts) para os sockets. */
  handleDbEvent(event: MockDbEvent): void {
    if (event.type === 'nft.updated') {
      const envelope = this.buildNftEvent(event.nftId)
      if (envelope) this.broadcast(envelope)
      return
    }

    const envelope = this.buildOrderEvent(event.orderId)
    if (envelope) this.broadcast(envelope)
  }

  /** Emissão controlada para testes: evento do NFT com duplicata e/ou versão antiga opcionais. */
  emitNft(nftId: string, options: EmitOptions = {}): SocketEvent | null {
    const envelope = this.buildNftEvent(nftId)
    if (!envelope) return null

    this.broadcast(envelope)
    if (options.duplicate) this.broadcast(envelope)
    if (options.stale) {
      this.broadcast({
        ...envelope,
        id: this.nextId(),
        version: Math.max(1, envelope.version - 1),
        payload: { ...envelope.payload, price: STALE_PRICE },
      })
    }
    return envelope
  }

  /** Derruba todas as conexões (os clientes reconectam e reconciliam via REST). */
  dropAll(): number {
    const clients = [...this.clients.keys()]
    for (const client of clients) client.close()
    return clients.length
  }

  stats(): { connected: number; authenticated: number } {
    const states = [...this.clients.values()]
    return { connected: states.length, authenticated: states.filter((state) => state.userId !== null).length }
  }

  private nextId(): string {
    this.sequence += 1
    return `evt_${this.sequence}`
  }

  private bump(key: string): number {
    const next = (this.versions.get(key) ?? 0) + 1
    this.versions.set(key, next)
    return next
  }

  private buildNftEvent(nftId: string): SocketEvent | null {
    const nft = getDb().nfts.find((candidate) => candidate.id === nftId)
    if (!nft) return null

    const payload: NftUpdatedPayload = {
      id: nft.id,
      name: nft.name,
      price: nft.price,
      ...(nft.oldPrice ? { oldPrice: nft.oldPrice } : {}),
      editions: structuredClone(nft.editions),
      updatedAt: nft.updatedAt,
    }

    return {
      id: this.nextId(),
      type: 'nft.updated',
      resource: 'nft',
      resourceId: nft.id,
      version: this.bump(`nft:${nft.id}`),
      payload,
    }
  }

  private buildOrderEvent(orderId: string): SocketEvent | null {
    const order = getDb().orders.find((candidate) => candidate.id === orderId)
    if (!order) return null

    const payload: OrderUpdatedPayload = {
      orderId: order.id,
      status: order.status,
      ...(order.txRef ? { txRef: order.txRef } : {}),
      ...(order.txExplorerUrl ? { txExplorerUrl: order.txExplorerUrl } : {}),
      updatedAt: order.updatedAt,
    }

    return {
      id: this.nextId(),
      type: 'order.updated',
      resource: 'order',
      resourceId: order.id,
      // Estados terminais têm sempre versão maior que `pending`: um evento atrasado nunca regride o pedido.
      version: order.status === 'pending' ? 1 : 2,
      userId: order.userId,
      payload,
    }
  }

  private broadcast(envelope: SocketEvent): void {
    for (const [client, state] of this.clients) {
      if (state.userId === null) continue
      if (envelope.userId && envelope.userId !== state.userId) continue
      client.send(envelope.type, envelope)
    }
  }
}

export const realtimeHub = new RealtimeHub()
