import { describe, expect, it } from 'vitest'
import { safeRedirect } from './redirect'

describe('safeRedirect', () => {
  it('keeps internal paths with query and hash', () => {
    expect(safeRedirect('/cart')).toBe('/cart')
    expect(safeRedirect('/nft/1?aba=detalhes#avaliacoes')).toBe('/nft/1?aba=detalhes#avaliacoes')
  })

  it('rejects external, protocol-relative and scheme urls', () => {
    const bad = ['https://evil.com', '//evil.com', '/\\evil.com', 'javascript:alert(1)', 'evil.com', '', '   ']
    for (const value of bad) {
      expect(safeRedirect(value)).toBe('/')
    }
    expect(safeRedirect(undefined)).toBe('/')
    expect(safeRedirect(null)).toBe('/')
  })

  it('never sends the user back to the auth screens', () => {
    expect(safeRedirect('/login')).toBe('/')
    expect(safeRedirect('/signup?redirect=/cart')).toBe('/')
  })

  it('rejects control characters and honors the fallback', () => {
    expect(safeRedirect('/cart\n/evil')).toBe('/')
    expect(safeRedirect('evil', '/inicio')).toBe('/inicio')
  })
})
