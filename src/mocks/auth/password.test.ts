import { webcrypto } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { userFixtures } from '../fixtures'
import { hashPassword, verifyPassword } from './password'

// Credenciais fictícias documentadas no README.md.
const DEMO_CREDENTIALS: Record<string, string> = {
  'alice@nft.test': 'Alice@123',
  'bob@nft.test': 'Bob@456',
}

beforeAll(() => {
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto,
      configurable: true,
    })
  }
})

describe('demo credentials', () => {
  for (const user of userFixtures) {
    it(`authenticates ${user.email} with the documented password`, async () => {
      const password = DEMO_CREDENTIALS[user.email]
      expect(password).toBeDefined()

      const derived = await hashPassword(
        password,
        user.passwordSalt,
        user.passwordIterations,
      )
      expect(derived).toBe(user.passwordHash)
      await expect(verifyPassword(password, user)).resolves.toBe(true)
    })
  }

  it('rejects a wrong password', async () => {
    const alice = userFixtures[0]
    await expect(verifyPassword('SenhaErrada@123', alice)).resolves.toBe(false)
  })
})
