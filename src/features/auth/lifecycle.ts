import { queryClient } from '@/shared/api/query-client'
import { configureHttp, http } from '@/shared/api/http'
import { qk } from '@/shared/api/query-keys'
import type { ApiError, AuthResponse } from '@/shared/contracts'
import { closeSessionExpired, openSessionExpired } from './session-expired-store'
import { clearSession, getToken, setSession } from './session-store'

let lastUserId: string | null = null
const resetCallbacks = new Set<() => void>()

/** Registra uma limpeza extra no logout/troca de usuário (ex.: desconectar o Socket.IO na Etapa 06). */
export function onClientReset(callback: () => void): () => void {
  resetCallbacks.add(callback)
  return () => {
    resetCallbacks.delete(callback)
  }
}

/** Efetiva um login/cadastro: troca de usuário limpa o cache, evitando vazamento entre contas. */
export function completeAuth(auth: AuthResponse): void {
  if (lastUserId !== auth.user.id) queryClient.clear()
  lastUserId = auth.user.id
  setSession(auth.session)
  queryClient.setQueryData(qk.session, auth)
  closeSessionExpired()
}

/** Zera tudo o que é privado: token, cache e integrações registradas. */
export function resetClientState(): void {
  clearSession()
  queryClient.clear()
  lastUserId = null
  for (const callback of resetCallbacks) callback()
}

export async function logout(): Promise<void> {
  try {
    if (getToken()) await http.post('/auth/logout')
  } catch {
    // A sessão pode já ter expirado no servidor; o estado local é limpo de qualquer forma.
  }
  resetClientState()
}

/**
 * Trata 401 vindos da API. Telas de auth são ignoradas (senha errada também é 401).
 * Falha ao restaurar a sessão (`/session`) é silenciosa; em qualquer outra chamada o usuário
 * vê o diálogo e retoma de onde parou depois de entrar de novo.
 */
export function handleAuthError(error: ApiError, url: string | undefined): void {
  if (url?.startsWith('/auth/')) return
  if (!getToken()) return
  if (error.code !== 'SESSION_EXPIRED' && error.code !== 'UNAUTHENTICATED') return

  clearSession()
  if (url === '/session') return

  openSessionExpired(`${window.location.pathname}${window.location.search}${window.location.hash}`)
}

export function setupAuth(): void {
  configureHttp({ getToken, onAuthError: handleAuthError })
}
