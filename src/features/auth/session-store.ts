import { useSyncExternalStore } from 'react'
import { z } from 'zod'
import { IsoDateSchema, type Session } from '@/shared/contracts'

// Decisão: o token fica em localStorage para sobreviver ao refresh e sincronizar abas
// (logout em uma aba derruba as outras). É uma demonstração com backend simulado; em um
// backend real o ideal seria cookie HttpOnly + SameSite.
export const SESSION_STORAGE_KEY = 'kurio:session'

const StoredSessionSchema = z.object({
  token: z.string().min(1),
  expiresAt: IsoDateSchema,
  userId: z.string().min(1),
})

export type StoredSession = z.infer<typeof StoredSessionSchema>

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function readStored(): StoredSession | null {
  try {
    const raw = storage()?.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = StoredSessionSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

let current: StoredSession | null = readStored()
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

export function getStoredSession(): StoredSession | null {
  return current
}

export function getToken(): string | null {
  return current?.token ?? null
}

export function setSession(session: Session): void {
  current = { token: session.token, expiresAt: session.expiresAt, userId: session.userId }
  try {
    storage()?.setItem(SESSION_STORAGE_KEY, JSON.stringify(current))
  } catch {
    // Sem localStorage (modo privado/quota): a sessão vale só em memória.
  }
  notify()
}

export function clearSession(): void {
  current = null
  try {
    storage()?.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Sem localStorage: nada a limpar.
  }
  notify()
}

/** Relê o storage (outra aba mudou a sessão; também usado nos testes). */
export function reloadSessionFromStorage(): void {
  current = readStored()
  notify()
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useStoredSession(): StoredSession | null {
  return useSyncExternalStore(subscribeSession, getStoredSession, getStoredSession)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === SESSION_STORAGE_KEY || event.key === null) reloadSessionFromStorage()
  })
}
