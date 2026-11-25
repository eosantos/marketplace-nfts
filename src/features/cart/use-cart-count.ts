import { useQuery } from '@tanstack/react-query'
import { http } from '@/shared/api/http'
import { qk } from '@/shared/api/query-keys'
import { CartSchema } from '@/shared/contracts'
import { useSession } from '@/features/auth/hooks'

/** Quantidade total de unidades no carrinho do usuário autenticado (0 para visitantes). */
export function useCartCount(): number {
  const { user } = useSession()
  const userId = user?.id

  const query = useQuery({
    queryKey: qk.cart(userId ?? 'anonymous'),
    queryFn: async ({ signal }) => {
      const response = await http.get<unknown>('/cart', { signal })
      return CartSchema.parse(response.data)
    },
    enabled: userId !== undefined,
  })

  return query.data?.items.reduce((total, item) => total + item.quantity, 0) ?? 0
}
