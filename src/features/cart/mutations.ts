import type { MutationObserverOptions, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { parseApiError } from '@/shared/api/errors'
import { qk } from '@/shared/api/query-keys'
import type { Cart } from '@/shared/contracts'
import { removeCartItemRequest, updateCartItemRequest } from './api'

export const CART_MUTATION_KEY = ['cart-mutations'] as const

export interface CartMutationContext {
  key: ReturnType<typeof qk.cart>
  previous: Cart | undefined
}

type CartVariables<T> = MutationObserverOptions<Cart, Error, T, CartMutationContext | undefined>

/** Aplica uma transformação otimista no carrinho do cache e devolve o necessário para o rollback. */
async function applyOptimistic(
  queryClient: QueryClient,
  userId: string | undefined,
  transform: (cart: Cart) => Cart,
): Promise<CartMutationContext | undefined> {
  if (!userId) return undefined
  const key = qk.cart(userId)
  await queryClient.cancelQueries({ queryKey: key })
  const previous = queryClient.getQueryData<Cart>(key)
  queryClient.setQueryData<Cart>(key, (old) => (old ? transform(old) : old))
  return { key, previous }
}

function rollback(queryClient: QueryClient, error: unknown, context: CartMutationContext | undefined): void {
  if (context?.previous) queryClient.setQueryData(context.key, context.previous)
  toast.error(parseApiError(error).message)
}

/**
 * Só reconcilia com o servidor quando esta é a última mutation do carrinho em andamento: assim
 * toques rápidos em "+" não fazem a tela piscar entre valores intermediários.
 */
function reconcile(queryClient: QueryClient, context: CartMutationContext | undefined): void {
  if (!context) return
  if (queryClient.isMutating({ mutationKey: CART_MUTATION_KEY }) <= 1) {
    void queryClient.invalidateQueries({ queryKey: context.key })
  }
}

export function updateQuantityOptions(
  queryClient: QueryClient,
  userId: string | undefined,
): CartVariables<{ itemId: string; quantity: number }> {
  return {
    mutationKey: CART_MUTATION_KEY,
    mutationFn: ({ itemId, quantity }) => updateCartItemRequest(itemId, quantity),
    onMutate: ({ itemId, quantity }) =>
      applyOptimistic(queryClient, userId, (cart) => ({
        ...cart,
        items: cart.items.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
      })),
    onError: (error, _variables, context) => {
      rollback(queryClient, error, context)
    },
    onSettled: (_data, _error, _variables, context) => {
      reconcile(queryClient, context)
    },
  }
}

export function removeItemOptions(
  queryClient: QueryClient,
  userId: string | undefined,
): CartVariables<{ itemId: string }> {
  return {
    mutationKey: CART_MUTATION_KEY,
    mutationFn: ({ itemId }) => removeCartItemRequest(itemId),
    onMutate: ({ itemId }) =>
      applyOptimistic(queryClient, userId, (cart) => ({
        ...cart,
        items: cart.items.filter((item) => item.id !== itemId),
      })),
    onSuccess: () => {
      toast.success('Item removido do carrinho.')
    },
    onError: (error, _variables, context) => {
      rollback(queryClient, error, context)
    },
    onSettled: (_data, _error, _variables, context) => {
      reconcile(queryClient, context)
    },
  }
}
