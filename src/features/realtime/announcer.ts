import { useSyncExternalStore } from 'react'

// Mensagens para leitores de tela (região aria-live em RealtimeAnnouncer). Alternar um caractere
// invisível faz uma mensagem repetida ser anunciada de novo.
let current = ''
let toggle = false
const listeners = new Set<() => void>()

export function announce(message: string): void {
  toggle = !toggle
  current = toggle ? message : `${message}\u00a0`
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useAnnouncement(): string {
  return useSyncExternalStore(subscribe, () => current, () => current)
}
