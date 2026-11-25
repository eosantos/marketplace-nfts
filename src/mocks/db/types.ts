// Tipos internos do banco simulado. Não são contratos públicos da API:
// `MockUserRecord` guarda credenciais (hash + salt) que nunca saem do mock.

import type { Cart, Favorite, Nft, Order, Quote, Session, User, Wallet } from '@/shared/contracts'
import type { MockScenario } from '../scenarios/names'

export interface MockUserRecord extends User {
  passwordHash: string
  passwordSalt: string
  passwordIterations: number
}

export interface MockCoupon {
  code: string
  kind: 'percent' | 'fixed'
  /** Percentual (0–100) quando `percent`; valor em ETH quando `fixed`. */
  value: string
  status: 'active' | 'expired' | 'invalid'
  description: string
  expiresAt: string
}

export interface MockQuote extends Quote {
  userId: string
  createdAt: string
}

export interface MockIdempotencyRecord {
  orderId: string
  requestHash: string
  createdAt: string
}

export interface MockSequences {
  order: number
  quote: number
  session: number
  wallet: number
  /** Criadas sob demanda (bancos persistidos antes desta etapa não as possuem). */
  cartItem?: number
  user?: number
}

export interface MockDb {
  schemaVersion: number
  scenario: MockScenario
  users: MockUserRecord[]
  sessions: Session[]
  nfts: Nft[]
  favorites: Favorite[]
  carts: Cart[]
  wallets: Wallet[]
  coupons: MockCoupon[]
  quotes: MockQuote[]
  orders: Order[]
  idempotency: Record<string, MockIdempotencyRecord>
  sequences: MockSequences
  /** Estado de conexão simulada por carteira (walletId -> conectada). */
  walletConnections?: Record<string, boolean>
}
