import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks'
import { qk } from '@/shared/api/query-keys'
import type { Wallet, WalletConnection, WalletUpdateInput } from '@/shared/contracts'
import {
  connectWalletRequest,
  createWalletRequest,
  disconnectWalletRequest,
  fetchWallets,
  updateWalletRequest,
} from './api'

export function useWallets() {
  const { user } = useSession()
  return useQuery({
    queryKey: qk.wallets(user?.id ?? 'anonymous'),
    queryFn: ({ signal }) => fetchWallets(signal),
    enabled: user !== null,
  })
}

function useWalletsKey() {
  const { user } = useSession()
  return qk.wallets(user?.id ?? 'anonymous')
}

/** Reflete o resultado da conexão simulada no cache da lista. */
function patchConnection(list: Wallet[] | undefined, result: WalletConnection): Wallet[] | undefined {
  return list?.map((wallet) =>
    wallet.id === result.walletId ? { ...wallet, connected: result.connected } : wallet,
  )
}

/** Conectar pode ser RECUSADO pelo servidor (cenário wallet-refused): o erro fica em `mutation.error`. */
export function useConnectWallet() {
  const queryClient = useQueryClient()
  const key = useWalletsKey()
  return useMutation({
    mutationFn: (walletId: string) => connectWalletRequest(walletId),
    onSuccess: (result) => {
      queryClient.setQueryData<Wallet[]>(key, (old) => patchConnection(old, result))
    },
  })
}

export function useDisconnectWallet() {
  const queryClient = useQueryClient()
  const key = useWalletsKey()
  return useMutation({
    mutationFn: (walletId: string) => disconnectWalletRequest(walletId),
    onSuccess: (result) => {
      queryClient.setQueryData<Wallet[]>(key, (old) => patchConnection(old, result))
    },
  })
}

export function useCreateWallet() {
  const queryClient = useQueryClient()
  const key = useWalletsKey()
  return useMutation({
    mutationFn: createWalletRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

/** Editar pode promover/rebaixar a principal (outras mudam no servidor): recarrega a lista. */
export function useUpdateWallet() {
  const queryClient = useQueryClient()
  const key = useWalletsKey()
  return useMutation({
    mutationFn: ({ walletId, input }: { walletId: string; input: WalletUpdateInput }) =>
      updateWalletRequest(walletId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
