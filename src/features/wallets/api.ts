import { z } from 'zod'
import {
  WalletConnectionSchema,
  WalletSchema,
  type Wallet,
  type WalletConnection,
  type WalletCreateInput,
} from '@/shared/contracts'
import { http } from '@/shared/api/http'

export async function fetchWallets(signal?: AbortSignal): Promise<Wallet[]> {
  const response = await http.get<unknown>('/wallets', signal ? { signal } : {})
  return z.array(WalletSchema).parse(response.data)
}

export async function createWalletRequest(input: WalletCreateInput): Promise<Wallet> {
  const response = await http.post<unknown>('/wallets', input)
  return WalletSchema.parse(response.data)
}

export async function connectWalletRequest(walletId: string): Promise<WalletConnection> {
  const response = await http.post<unknown>(`/wallets/${encodeURIComponent(walletId)}/connect`)
  return WalletConnectionSchema.parse(response.data)
}

export async function disconnectWalletRequest(walletId: string): Promise<WalletConnection> {
  const response = await http.post<unknown>(`/wallets/${encodeURIComponent(walletId)}/disconnect`)
  return WalletConnectionSchema.parse(response.data)
}
