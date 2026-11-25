import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearSession,
  getStoredSession,
  getToken,
  reloadSessionFromStorage,
  SESSION_STORAGE_KEY,
  setSession,
  subscribeSession,
} from './session-store'

const SESSION = {
  id: 'sess_1',
  userId: 'user_alice',
  token: 'kurio_abc',
  expiresAt: '2026-12-01T12:00:00.000Z',
}

beforeEach(() => {
  clearSession()
})

describe('session store', () => {
  it('persists the session in localStorage and clears it', () => {
    expect(getToken()).toBeNull()

    setSession(SESSION)
    expect(getToken()).toBe('kurio_abc')
    expect(getStoredSession()?.userId).toBe('user_alice')
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toContain('kurio_abc')

    clearSession()
    expect(getToken()).toBeNull()
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  it('notifies subscribers until they unsubscribe', () => {
    let calls = 0
    const unsubscribe = subscribeSession(() => {
      calls += 1
    })

    setSession(SESSION)
    clearSession()
    expect(calls).toBe(2)

    unsubscribe()
    setSession(SESSION)
    expect(calls).toBe(2)
  })

  it('restores a valid session and ignores corrupt data', () => {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ token: 'tok', expiresAt: '2026-12-01T12:00:00.000Z', userId: 'u1' }),
    )
    reloadSessionFromStorage()
    expect(getToken()).toBe('tok')

    window.localStorage.setItem(SESSION_STORAGE_KEY, '{not json')
    reloadSessionFromStorage()
    expect(getToken()).toBeNull()

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: '', expiresAt: 'x', userId: '' }))
    reloadSessionFromStorage()
    expect(getToken()).toBeNull()
  })
})
