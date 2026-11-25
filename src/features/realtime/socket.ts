import { REALTIME_PATH } from '@/shared/contracts'
import type { SocketLike } from './manager'

/**
 * Cliente socket.io real. Só WebSocket (o servidor simulado do MSW não fala polling), mesma
 * origem da página e reconexão rápida e determinística (sem jitter) para os testes E2E.
 *
 * IMPORTANTE: o `engine.io-client` guarda `globalThis.WebSocket` no momento em que é importado.
 * Se ele fosse importado no carregamento da página, guardaria o WebSocket NATIVO (o MSW só troca o
 * global depois de iniciar) e a conexão escaparia do servidor simulado, ficando pendurada até o
 * timeout. Por isso o import é dinâmico e só acontece quando o gerenciador vai conectar.
 */
export async function createSocketIoClient(): Promise<SocketLike> {
  const { io } = await import('socket.io-client')

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
