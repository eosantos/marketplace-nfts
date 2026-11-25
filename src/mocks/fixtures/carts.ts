// Fixtures de carrinhos. Cada usuário tem o próprio carrinho; nenhum item é
// compartilhado entre usuários.

import type { Cart } from '@/shared/contracts'

export const cartFixtures: Cart[] = [
  {
    userId: 'user_alice',
    items: [
      { id: 'cart_alice_001', nftId: 'nft_002', editionType: '1/10', quantity: 2 },
      { id: 'cart_alice_002', nftId: 'nft_003', editionType: '1/1', quantity: 1 },
    ],
    updatedAt: '2026-07-20T14:30:00.000Z',
  },
  {
    userId: 'user_bob',
    items: [
      { id: 'cart_bob_001', nftId: 'nft_004', editionType: '1/50', quantity: 3 },
      { id: 'cart_bob_002', nftId: 'nft_005', editionType: 'ABERTA', quantity: 2 },
    ],
    updatedAt: '2026-07-21T09:05:00.000Z',
  },
]
