import { io } from 'socket.io-client'
import { REALTIME_PATH } from '@/shared/contracts'
import type { SocketLike } from './manager'

/**
 * Cliente socket.io real. Só WebSocket (o servidor simulado do MSW não fala polling), mesma
 * origem da página e reconexão rápida e determinística (sem jitter) para os testes E2E.
 */
export function createSocketIoClient(): SocketLike {
  const socket = io(window.location.origin, {
    path: REALTIME_PATH,
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 2000,
    randomizationFactor: 0,
  })

  return {
    on: (event, listener) => {
      socket.on(event, listener)
    },
    emit: (event, ...args) => {
      socket.emit(event, ...args)
    },
    connect: () => {
      socket.connect()
    },
    disconnect: () => {
      socket.disconnect()
    },
  }
}
