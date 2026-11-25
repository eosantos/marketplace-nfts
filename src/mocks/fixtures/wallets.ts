// Fixtures de carteiras (principal e secundária) por usuário.

import type { Wallet } from '@/shared/contracts'

export const walletFixtures: Wallet[] = [
  {
    id: 'wallet_alice_primary',
    userId: 'user_alice',
    nickname: 'Carteira principal',
    network: 'Ethereum',
    address: '0x4C1E9A7B2D3F5A6B7C8D9E0F1A2B3C4D5E6F7A8B',
    type: 'MetaMask',
    ensName: 'alice.eth',
    isPrimary: true,
    createdAt: '2026-06-02T10:00:00.000Z',
    updatedAt: '2026-06-02T10:00:00.000Z',
  },
  {
    id: 'wallet_alice_secondary',
    userId: 'user_alice',
    nickname: 'Reserva',
    network: 'Polygon',
    address: '0x7A42E8C1B9D0F3A4C5E6B7D8A9F0C1E2B3D4A5F6',
    type: 'WalletConnect',
    ensName: 'alice-reserva.eth',
    isPrimary: false,
    createdAt: '2026-06-03T15:20:00.000Z',
    updatedAt: '2026-06-03T15:20:00.000Z',
  },
  {
    id: 'wallet_bob_primary',
    userId: 'user_bob',
    nickname: 'Cofre principal',
    network: 'Solana',
    address: '0x9B8C7D6E5F4A3B2C1D0E9F8A7B6C5D4E3F2A1B0C',
    type: 'Coinbase Wallet',
    ensName: 'bob.eth',
    isPrimary: true,
    createdAt: '2026-05-16T08:15:00.000Z',
    updatedAt: '2026-05-16T08:15:00.000Z',
  },
  {
    id: 'wallet_bob_secondary',
    userId: 'user_bob',
    nickname: 'Secundária',
    network: 'Ethereum',
    address: '0x1F2E3D4C5B6A7F8E9D0C1B2A3F4E5D6C7B8A9F0E',
    type: 'MetaMask',
    ensName: 'bob-vault.eth',
    isPrimary: false,
    createdAt: '2026-05-17T19:40:00.000Z',
    updatedAt: '2026-05-17T19:40:00.000Z',
  },
]
