import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from '@/features/auth/hooks'
import { parseApiError } from '@/shared/api/errors'
import { qk } from '@/shared/api/query-keys'
import type { CartItemInput, Nft, NftEditionType } from '@/shared/contracts'
import { addCartItemRequest, fetchCartRequest, requestQuote } from './api'
import {
  addToGuestCart,
  removeFromGuestCart,
  updateGuestQuantity,
  useGuestCart,
} from './guest-cart'
import { removeItemOptions, updateQuantityOptions } from './mutations'

/** Carrinho do usuário autenticado (a chave inclui o userId). */
export function useCartQuery() {
  const { user } = useSession()
  return useQuery({
    queryKey: qk.cart(user?.id ?? 'anonymous'),
    queryFn: ({ signal }) => fetchCartRequest(signal),
    enabled: user !== null,
  })
}

/** Linha do carrinho (da conta ou do visitante) numa forma única para a UI. */
export interface CartLine {
  /** Identidade estável na UI (`id` do servidor, ou nftId|edição para visitante). */
  key: string
  /** Id da linha no servidor; `null` para o carrinho de visitante. */
  id: string | null
  nftId: string
  editionType: NftEditionType
  quantity: number
}

export function useCartLines() {
  const { user, isLoading: sessionLoading } = useSession()
  const serverCart = useCartQuery()
  const guestItems = useGuestCart()

  if (user) {
    return {
      isGuest: false as const,
      isLoading: serverCart.isPending,
      isError: serverCart.isError && !serverCart.data,
      refetch: () => {
        void serverCart.refetch()
      },
      lines: (serverCart.data?.items ?? []).map(
        (item): CartLine => ({
          key: item.id,
          id: item.id,
          nftId: item.nftId,
          editionType: item.editionType,
          quantity: item.quantity,
        }),
      ),
    }
  }

  return {
    isGuest: true as const,
    isLoading: sessionLoading,
    isError: false,
    refetch: () => undefined,
    lines: guestItems.map(
      (item): CartLine => ({
        key: `${item.nftId}|${item.editionType}`,
        id: null,
        nftId: item.nftId,
        editionType: item.editionType,
        quantity: item.quantity,
      }),
    ),
  }
}

/** Adiciona ao carrinho da conta (API). */
export function useAddToCart() {
  const queryClient = useQueryClient()
  const { user } = useSession()

  return useMutation({
    mutationFn: (input: CartItemInput) => addCartItemRequest(input),
    onSuccess: (cart) => {
      if (user) queryClient.setQueryData(qk.cart(user.id), cart)
      toast.success('Adicionado ao carrinho.')
    },
    onError: (error) => {
      // O servidor explica o motivo (ex.: limite por comprador, edição esgotada).
      toast.error(parseApiError(error).message)
    },
  })
}

/** Adicionar ao carrinho: conta logada usa a API; visitante usa o carrinho local (com os mesmos limites). */
export function useCartAdd() {
  const { user } = useSession()
  const addToCart = useAddToCart()

  return {
    isPending: addToCart.isPending,
    add: (nft: Nft, item: CartItemInput, onSuccess?: () => void): void => {
      if (user) {
        addToCart.mutate(item, onSuccess ? { onSuccess } : undefined)
        return
      }
      const result = addToGuestCart(nft, item)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success('Adicionado ao carrinho.')
      onSuccess?.()
    },
  }
}

/**
 * Ações de uma linha. As mutations da mesma linha rodam em série (`scope`), então toques rápidos
 * em "+" chegam ao servidor na ordem certa mesmo com latência variável.
 */
export function useCartLineActions(line: CartLine) {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const scope = { id: `cart-line-${line.key}` }

  const update = useMutation({ ...updateQuantityOptions(queryClient, user?.id), scope })
  const remove = useMutation({ ...removeItemOptions(queryClient, user?.id), scope })

  return {
    setQuantity: (quantity: number): void => {
      if (line.id) update.mutate({ itemId: line.id, quantity })
      else updateGuestQuantity(line.nftId, line.editionType, quantity)
    },
    remove: (): void => {
      if (line.id) {
        remove.mutate({ itemId: line.id })
        return
      }
      removeFromGuestCart(line.nftId, line.editionType)
      toast.success('Item removido do carrinho.')
    },
    isRemoving: remove.isPending,
  }
}

/** Assinatura estável da cotação: mesma lista e cupom, mesma chave (ordem das linhas não importa). */
export function quoteSignature(items: CartItemInput[], coupon: string | null): string {
  const normalized = items
    .map(({ nftId, editionType, quantity }) => [nftId, editionType, quantity] as const)
    .sort((a, b) => `${a[0]}|${a[1]}`.localeCompare(`${b[0]}|${b[1]}`))
  return JSON.stringify([normalized, coupon])
}

/**
 * Cotação do carrinho (POST /quote). A chave muda com itens e cupom; `keepPreviousData` mantém os
 * valores anteriores (esmaecidos) enquanto o novo resumo carrega, sem salto de layout.
 */
export function useQuote(lines: CartLine[], coupon: string | null) {
  const { user } = useSession()
  const items = lines.map(({ nftId, editionType, quantity }) => ({ nftId, editionType, quantity }))

  return useQuery({
    queryKey: qk.quote(user?.id ?? 'anonymous', quoteSignature(items, coupon)),
    queryFn: () => requestQuote(items, coupon),
    enabled: user !== null && items.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: false,
  })
}
