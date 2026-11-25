import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { takePendingAction } from '@/features/auth/pending-action'
import { useSession } from '@/features/auth/hooks'
import { useAddToCart } from '@/features/cart/hooks'
import { useToggleFavorite } from '@/features/favorites/hooks'

/** Executa uma vez a ação que o visitante tentou antes de entrar (favoritar ou comprar). */
export function PendingActionRunner() {
  const router = useRouter()
  const { user } = useSession()
  const toggleFavorite = useToggleFavorite()
  const addToCart = useAddToCart()
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    const action = takePendingAction()
    if (!action) return

    if (action.type === 'favorite') {
      toggleFavorite.mutate({ nftId: action.nftId, favorite: true })
      return
    }

    addToCart.mutate(
      { nftId: action.nftId, editionType: action.editionType, quantity: action.quantity },
      {
        onSuccess: () => {
          if (action.buyNow) router.history.push('/cart')
        },
      },
    )
    // Roda uma vez por usuário autenticado; as mutations são estáveis para este propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return null
}
