import { describe, expect, it } from 'vitest'
import { walletFormSchema } from '@/features/wallets/schemas'
import {
  AVATAR_MAX_BYTES,
  passwordFormSchema,
  profileFormSchema,
  validateAvatarFile,
} from './schemas'

describe('profileFormSchema', () => {
  it('trims and accepts valid values', () => {
    const parsed = profileFormSchema.parse({ displayName: ' Alice ', userName: 'alice_01', profileName: 'Alice C.' })
    expect(parsed.displayName).toBe('Alice')
  })

  it('rejects blank names and invalid userName characters', () => {
    const result = profileFormSchema.safeParse({ displayName: ' ', userName: 'a b', profileName: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0])
      expect(new Set(fields)).toEqual(new Set(['displayName', 'userName', 'profileName']))
    }
  })
})

describe('passwordFormSchema', () => {
  const base = { currentPassword: 'Alice@123', newPassword: 'Novasenha@1', confirmPassword: 'Novasenha@1' }

  it('accepts a matching confirmation', () => {
    expect(passwordFormSchema.safeParse(base).success).toBe(true)
  })

  it('flags a mismatching confirmation on confirmPassword', () => {
    const result = passwordFormSchema.safeParse({ ...base, confirmPassword: 'outra' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['confirmPassword'])
  })

  it('requires at least 8 characters in the new password', () => {
    const result = passwordFormSchema.safeParse({ ...base, newPassword: '123', confirmPassword: '123' })
    expect(result.success).toBe(false)
  })
})

describe('validateAvatarFile', () => {
  it('accepts png, jpeg and webp within the limit', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
      expect(validateAvatarFile({ type, size: 1024 })).toBeNull()
    }
    expect(validateAvatarFile({ type: 'image/png', size: AVATAR_MAX_BYTES })).toBeNull()
  })

  it('rejects other types and files above 300 KB', () => {
    expect(validateAvatarFile({ type: 'image/gif', size: 10 })).toBe('Use uma imagem PNG, JPEG ou WebP.')
    expect(validateAvatarFile({ type: 'image/png', size: AVATAR_MAX_BYTES + 1 })).toBe(
      'A imagem deve ter no máximo 300 KB.',
    )
  })
})

describe('walletFormSchema', () => {
  const valid = {
    nickname: 'Reserva',
    network: 'Polygon',
    address: `0x${'a'.repeat(40)}`,
    type: 'WalletConnect',
    ensName: '',
  }

  it('accepts an empty ENS name and a valid one', () => {
    expect(walletFormSchema.safeParse(valid).success).toBe(true)
    expect(walletFormSchema.safeParse({ ...valid, ensName: 'alice.eth' }).success).toBe(true)
  })

  it('rejects malformed address and ENS', () => {
    expect(walletFormSchema.safeParse({ ...valid, address: '0x123' }).success).toBe(false)
    expect(walletFormSchema.safeParse({ ...valid, ensName: 'alice' }).success).toBe(false)
  })
})
