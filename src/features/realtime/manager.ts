import type { QueryClient } from '@tanstack/react-query'
import { SocketEventSchema } from '@/shared/contracts'
import { applyRealtimeEvent } from './apply-event'
import { EventLedger } from './ledger'

/** O mínimo de socket.io-client que o gerenciador usa (permite um socket falso nos testes). */
export interface SocketLike {
  on: (event: string, listener: (...args: unknown[]) => void) => void
  emit: (event: string, ...args: unknown[]) => void
  connect: () => void
  disconnect: () => void
}

export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

interface RealtimeDeps {
  queryClient: QueryClient
  createSocket: () => SocketLike
  getToken: () => string | null
}

function readUserId(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null
  const userId = (payload as Record<string, unknown>).userId
  return typeof userId === 'string' ? userId : null
}

/**
 * Conexão em tempo real atrelada à sessão: conecta quando há token, autentica por evento,
 * desconecta no logout/expiração, ignora eventos duplicados/antigos/de outro usuário e, ao
 * reconectar, reconcilia os dados ativos pelo REST (eventos perdidos durante a queda).
 */
export class RealtimeManager {
  private socket: SocketLike | null = null
  private status: RealtimeStatus = 'disconnected'
  private userId: string | null = null
  private hasConnected = false
  private readonly ledger = new EventLedger()
  private readonly listeners = new Set<() => void>()

  constructor(private readonly deps: RealtimeDeps) {}

  getStatus = (): RealtimeStatus => this.status

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Chamado quando a sessão muda: conecta se houver token, desconecta se não houver. */
  syncWithSession(): void {
    const hasToken = this.deps.getToken() !== null
    if (hasToken && !this.socket) this.connect()
    else if (!hasToken && this.socket) this.disconnect()
  }

  /** Encerra a conexão e esquece tudo (logout, troca de usuário, sessão expirada). */
  disconnect(): void {
    const socket = this.socket
    this.socket = null
    this.userId = null
    this.hasConnected = false
    this.ledger.reset()
    socket?.disconnect()
    this.setStatus('disconnected')
  }

  private connect(): void {
    const socket = this.deps.createSocket()
    this.socket = socket
    this.setStatus('connecting')

    // A cada (re)conexão: autentica com o token atual.
    socket.on('connect', () => {
      socket.emit('authenticate', { token: this.deps.getToken() })
    })
    socket.on('authenticated', (payload) => {
      if (this.socket === socket) this.onAuthenticated(readUserId(payload))
    })
    // Sessão recusada: a UI trata pelo REST (401); aqui só paramos de insistir.
    socket.on('auth_error', () => {
      if (this.socket === socket) this.disconnect()
    })
    socket.on('disconnect', () => {
      if (this.socket === socket) this.setStatus('reconnecting')
    })
    socket.on('connect_error', () => {
      if (this.socket === socket) this.setStatus('reconnecting')
    })
    socket.on('nft.updated', (raw) => {
      if (this.socket === socket) this.handleEvent(raw)
    })
    socket.on('order.updated', (raw) => {
      if (this.socket === socket) this.handleEvent(raw)
    })

    socket.connect()
  }

  private onAuthenticated(userId: string | null): void {
    if (!userId) return
    this.userId = userId
    this.setStatus('connected')
    // Reconexão: o que aconteceu durante a queda não chegou por evento, então relê pelo REST.
    if (this.hasConnected) this.reconcile(userId)
    this.hasConnected = true
  }

  private handleEvent(raw: unknown): void {
    const userId = this.userId
    if (!userId) return

    const parsed = SocketEventSchema.safeParse(raw)
    if (!parsed.success) return
    const event = parsed.data

    // Evento de outro usuário nunca é aplicado (defesa em profundidade; o servidor já filtra).
    if (event.userId && event.userId !== userId) return
    if (!this.ledger.accept(event)) return

    applyRealtimeEvent({ queryClient: this.deps.queryClient, userId }, event)
  }

  /** Refaz (apenas as ativas) as consultas que os eventos mantêm atualizadas. */
  private reconcile(userId: string): void {
    const { queryClient } = this.deps
    void queryClient.invalidateQueries({ queryKey: ['nfts'] })
    void queryClient.invalidateQueries({ queryKey: ['cart', userId] })
    void queryClient.invalidateQueries({ queryKey: ['quote', userId] })
    void queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
    void queryClient.invalidateQueries({ queryKey: ['order', userId] })
  }

  private setStatus(status: RealtimeStatus): void {
    if (this.status === status) return
    this.status = status
    for (const listener of this.listeners) listener()
  }
}
