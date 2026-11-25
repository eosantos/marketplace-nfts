import { useEffect } from 'react'
import { takePendingAction } from '@/features/auth/pending-action'
import { useSession } from '@/features/auth/hooks'
import { useToggleFavorite } from '@/features/favorites/hooks'

/** Executa uma vez a ação que o visitante tentou antes de entrar (favoritar). */
export function PendingActionRunner() {
  const { user } = useSession()
  const toggleFavorite = useToggleFavorite()
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    const action = takePendingAction()
    if (action?.type === 'favorite') {
      toggleFavorite.mutate({ nftId: action.nftId, favorite: true })
    }
    // Roda uma vez por usuário autenticado; a mutation é estável para este propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return null
}
