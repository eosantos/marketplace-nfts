import {
  WalletCreateInputSchema,
  WalletUpdateInputSchema,
  type Wallet,
  type WalletConnection,
} from '@/shared/contracts'
import { getActiveScenario, getDb, mutateDb } from '../db'
import { nextSequence } from '../db/sequences'
import type { MockDb } from '../db/types'
import { fail, ok, validationFail, type ServiceResult } from '../http/result'

function addressTaken(db: MockDb, userId: string, address: string, exceptId?: string): boolean {
  return db.wallets.some(
    (wallet) =>
      wallet.userId === userId &&
      wallet.id !== exceptId &&
      wallet.address.toLowerCase() === address.toLowerCase(),
  )
}

function duplicateAddress(): ServiceResult<never> {
  return fail('VALIDATION_ERROR', 'Verifique os campos informados.', [
    { field: 'address', message: 'Este endereço já está cadastrado.' },
  ])
}

function demoteOthers(db: MockDb, userId: string, keepId: string): void {
  const now = new Date().toISOString()
  for (const wallet of db.wallets) {
    if (wallet.userId === userId && wallet.id !== keepId && wallet.isPrimary) {
      wallet.isPrimary = false
      wallet.updatedAt = now
    }
  }
}

export function listWallets(userId: string): ServiceResult<Wallet[]> {
  const db = getDb()
  const wallets = db.wallets
    .filter((wallet) => wallet.userId === userId)
    .map((wallet): Wallet => ({ ...wallet, connected: db.walletConnections?.[wallet.id] === true }))
    .sort(
      (a, b) =>
        Number(b.isPrimary) - Number(a.isPrimary) || a.createdAt.localeCompare(b.createdAt),
    )
  return ok(structuredClone(wallets))
}

export function createWallet(userId: string, input: unknown): ServiceResult<Wallet> {
  const parsed = WalletCreateInputSchema.safeParse(input)
  if (!parsed.success) return validationFail(parsed.error)

  const data = parsed.data

  return mutateDb((db): ServiceResult<Wallet> => {
    if (addressTaken(db, userId, data.address)) return duplicateAddress()

    const hasWallets = db.wallets.some((wallet) => wallet.userId === userId)
    const now = new Date().toISOString()
    const wallet: Wallet = {
      id: `wallet_${nextSequence(db, 'wallet')}`,
      userId,
      nickname: data.nickname,
      network: data.network,
      address: data.address,
      type: data.type,
      ...(data.ensName ? { ensName: data.ensName } : {}),
      // A primeira carteira do usuário é sempre a principal.
      isPrimary: data.isPrimary || !hasWallets,
      createdAt: now,
      updatedAt: now,
    }

    if (wallet.isPrimary) demoteOthers(db, userId, wallet.id)
    db.wallets.push(wallet)
    return ok(structuredClone(wallet))
  })
}

export function updateWallet(userId: string, walletId: string, input: unknown): ServiceResult<Wallet> {
  const parsed = WalletUpdateInputSchema.safeParse(input)
  if (!parsed.success) return validationFail(parsed.error)

  const data = parsed.data

  return mutateDb((db): ServiceResult<Wallet> => {
    const wallet = db.wallets.find((candidate) => candidate.id === walletId)
    if (!wallet) return fail('NOT_FOUND', 'Carteira não encontrada.')
    if (wallet.userId !== userId) return fail('FORBIDDEN', 'Esta carteira pertence a outro usuário.')

    if (data.address !== undefined && addressTaken(db, userId, data.address, walletId)) {
      return duplicateAddress()
    }
    if (data.isPrimary === false && wallet.isPrimary) {
      return fail('VALIDATION_ERROR', 'Verifique os campos informados.', [
        { field: 'isPrimary', message: 'Defina outra carteira como principal antes.' },
      ])
    }

    if (data.nickname !== undefined) wallet.nickname = data.nickname
    if (data.network !== undefined) wallet.network = data.network
    if (data.address !== undefined) wallet.address = data.address
    if (data.type !== undefined) wallet.type = data.type
    if (data.ensName === null) {
      delete wallet.ensName
    } else if (data.ensName !== undefined) {
      wallet.ensName = data.ensName
    }
    if (data.isPrimary === true) {
      wallet.isPrimary = true
      demoteOthers(db, userId, wallet.id)
    }
    wallet.updatedAt = new Date().toISOString()

    return ok(structuredClone(wallet))
  })
}

/** Conexão/desconexão simulada (o checkout consome este estado). */
export function setWalletConnection(
  userId: string,
  walletId: string,
  connected: boolean,
): ServiceResult<WalletConnection> {
  return mutateDb((db): ServiceResult<WalletConnection> => {
    const wallet = db.wallets.find((candidate) => candidate.id === walletId)
    if (!wallet) return fail('NOT_FOUND', 'Carteira não encontrada.')
    if (wallet.userId !== userId) return fail('FORBIDDEN', 'Esta carteira pertence a outro usuário.')
    // Cenário wallet-refused: o usuário recusa a conexão na carteira (desconectar continua possível).
    if (connected && getActiveScenario() === 'wallet-refused') {
      return fail('FORBIDDEN', 'Conexão recusada na carteira. Tente novamente ou escolha outra carteira.')
    }

    db.walletConnections = { ...(db.walletConnections ?? {}), [walletId]: connected }
    return ok({ walletId, connected, network: wallet.network, address: wallet.address })
  })
}
