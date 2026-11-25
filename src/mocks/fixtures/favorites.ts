// Fixtures de favoritos por usuário.

import type { Favorite } from '@/shared/contracts'

export const favoriteFixtures: Favorite[] = [
  { userId: 'user_alice', nftId: 'nft_004', createdAt: '2026-07-10T11:00:00.000Z' },
  { userId: 'user_alice', nftId: 'nft_007', createdAt: '2026-07-12T16:20:00.000Z' },
  { userId: 'user_alice', nftId: 'nft_010', createdAt: '2026-07-14T08:45:00.000Z' },
  { userId: 'user_bob', nftId: 'nft_001', createdAt: '2026-07-11T09:10:00.000Z' },
  { userId: 'user_bob', nftId: 'nft_012', createdAt: '2026-07-18T20:00:00.000Z' },
]
