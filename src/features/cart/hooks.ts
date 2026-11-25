import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from '@/features/auth/hooks'
import { parseApiError } from '@/shared/api/errors'
import { qk } from '@/shared/api/query-keys'
import type { CartItemInput } from '@/shared/contracts'
import { addCartItemRequest } from './api'

/** Adiciona um item ao carrinho do usuário autenticado e atualiza o contador do header. */
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
