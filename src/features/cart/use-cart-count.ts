import { countGuestUnits, useGuestCart } from './guest-cart'
import { useSession } from '@/features/auth/hooks'
import { useCartQuery } from './hooks'

/** Unidades no carrinho: da conta (API) quando logado, do visitante (localStorage) caso contrário. */
export function useCartCount(): number {
  const { user } = useSession()
  const server = useCartQuery()
  const guest = useGuestCart()

  if (user) return server.data?.items.reduce((total, item) => total + item.quantity, 0) ?? 0
  return countGuestUnits(guest)
}
