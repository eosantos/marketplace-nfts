import { useSyncExternalStore } from 'react'

export interface SessionExpiredState {
  open: boolean
  /** Rota (com query e hash) onde a sessão expirou, para retomar depois do novo login. */
  returnTo: string | null
}

let state: SessionExpiredState = { open: false, returnTo: null }
const listeners = new Set<() => void>()

function set(next: SessionExpiredState): void {
  state = next
  for (const listener of listeners) listener()
}

export function getSessionExpired(): SessionExpiredState {
  return state
}

export function openSessionExpired(returnTo: string): void {
  if (state.open) return
  set({ open: true, returnTo })
}

export function closeSessionExpired(): void {
  if (!state.open && state.returnTo === null) return
  set({ open: false, returnTo: null })
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useSessionExpired(): SessionExpiredState {
  return useSyncExternalStore(subscribe, getSessionExpired, getSessionExpired)
}
