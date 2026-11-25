// Fixtures dos colecionadores (≥ 2 usuários).
// Senhas nunca ficam em claro: apenas PBKDF2-SHA256 (120k iterações) + salt.
// Credenciais fictícias para login estão documentadas no README.

import type { MockUserRecord } from '../db/types'

export const userFixtures: MockUserRecord[] = [
  {
    id: 'user_alice',
    email: 'alice@nft.test',
    displayName: 'Alice Nakamura',
    userName: 'alice_naka',
    profileName: 'Alice no País dos NFTs',
    avatar: '/assets/nfts/ape-green.png',
    createdAt: '2026-06-01T12:00:00.000Z',
    passwordHash: 'ee5c5c650a3a7122aaa892b2943d2e8733b9bd76781a1a80b1a6fb4fb6e61172',
    passwordSalt: '6b1f7c9a2d4e8f0a3c5b7d9e1f2a4b6c',
    passwordIterations: 120000,
  },
  {
    id: 'user_bob',
    email: 'bob@nft.test',
    displayName: 'Bob Mendes',
    userName: 'bob_mendes',
    profileName: 'Bob’s Vault',
    avatar: '/assets/nfts/gorilla-black.png',
    createdAt: '2026-05-15T09:30:00.000Z',
    passwordHash: '2045e3625ced7d597b417def7321de5d640c037f5e179d7e48405e7ee8657932',
    passwordSalt: '9d3e5f7a1b2c4d6e8f0a2b4c6d8e0f1a',
    passwordIterations: 120000,
  },
]
