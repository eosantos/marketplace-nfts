import { onClientReset } from '@/features/auth/lifecycle'
import { getToken, subscribeSession } from '@/features/auth/session-store'
import { queryClient } from '@/shared/api/query-client'
import { RealtimeManager } from './manager'
import { createSocketIoClient } from './socket'

export const realtime = new RealtimeManager({
  queryClient,
  createSocket: createSocketIoClient,
  getToken,
})

/** Atrela a conexão em tempo real à sessão: conecta ao entrar, desconecta ao sair ou expirar. */
export function setupRealtime(): void {
  subscribeSession(() => {
    realtime.syncWithSession()
  })
  onClientReset(() => {
    realtime.disconnect()
  })
  realtime.syncWithSession()
}
