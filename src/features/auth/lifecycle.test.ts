import { beforeEach, describe, expect, it } from 'vitest'
import { qk } from '@/shared/api/query-keys'
import { queryClient } from '@/shared/api/query-client'
import type { AuthResponse } from '@/shared/contracts'
import { completeAuth, handleAuthError, onClientReset, resetClientState } from './lifecycle'
import { closeSessionExpired, getSessionExpired } from './session-expired-store'
import { getToken, setSession } from './session-store'

function authFor(userId: string): AuthResponse {
  return {
    user: {
      id: userId,
      email: `${userId}@nft.test`,
      displayName: userId,
      userName: userId,
      profileName: userId,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    session: { id: `sess_${userId}`, userId, token: `tok_${userId}`, expiresAt: '2026-12-01T12:00:00.000Z' },
  }
}

beforeEach(() => {
  resetClientState()
  closeSessionExpired()
})

describe('client state isolation', () => {
  it('clears the cache when the user changes and keeps it for the same user', () => {
    completeAuth(authFor('alice'))
    queryClient.setQueryData(['favorites', 'alice'], [1])

    completeAuth(authFor('alice'))
    expect(queryClient.getQueryData(['favorites', 'alice'])).toEqual([1])

    completeAuth(authFor('bob'))
    expect(queryClient.getQueryData(['favorites', 'alice'])).toBeUndefined()
    expect(getToken()).toBe('tok_bob')
    expect(queryClient.getQueryData(qk.session)).toEqual(authFor('bob'))
  })

  it('wipes token, cache and registered integrations on reset', () => {
    let calls = 0
    const off = onClientReset(() => {
      calls += 1
    })

    completeAuth(authFor('alice'))
    queryClient.setQueryData(['cart', 'alice'], { items: [] })
    resetClientState()

    expect(getToken()).toBeNull()
    expect(queryClient.getQueryData(['cart', 'alice'])).toBeUndefined()
    expect(calls).toBe(1)

    off()
    resetClientState()
    expect(calls).toBe(1)
  })
})

describe('401 handling', () => {
  it('ignores auth endpoints, visitors and non-session errors', () => {
    setSession(authFor('alice').session)
    handleAuthError({ code: 'UNAUTHENTICATED', message: 'senha errada' }, '/auth/login')
    handleAuthError({ code: 'FORBIDDEN', message: 'x' }, '/cart')
    expect(getToken()).toBe('tok_alice')
    expect(getSessionExpired().open).toBe(false)

    resetClientState()
    handleAuthError({ code: 'SESSION_EXPIRED', message: 'x' }, '/cart')
    expect(getSessionExpired().open).toBe(false)
  })

  it('fails silently when restoring the session on load', () => {
    setSession(authFor('alice').session)
    handleAuthError({ code: 'SESSION_EXPIRED', message: 'x' }, '/session')
    expect(getToken()).toBeNull()
    expect(getSessionExpired().open).toBe(false)
  })

  it('opens the session-expired dialog with the return path for any other call', () => {
    setSession(authFor('alice').session)
    handleAuthError({ code: 'SESSION_EXPIRED', message: 'x' }, '/cart')
    expect(getToken()).toBeNull()
    expect(getSessionExpired().open).toBe(true)
    expect(getSessionExpired().returnTo).toBe('/')

    closeSessionExpired()
    setSession(authFor('bob').session)
    handleAuthError({ code: 'UNAUTHENTICATED', message: 'sessão inválida' }, '/wallets')
    expect(getSessionExpired().open).toBe(true)
  })
})
