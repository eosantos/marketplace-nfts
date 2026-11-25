import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks'
import { qk } from '@/shared/api/query-keys'
import { fetchFavorites } from './api'
import { favoriteToggleOptions } from './mutation'

/** Favoritos do usuário autenticado (a chave inclui o userId). */
export function useFavorites() {
  const { user } = useSession()
  return useQuery({
    queryKey: qk.favorites(user?.id ?? 'anonymous'),
    queryFn: ({ signal }) => fetchFavorites(signal),
    enabled: user !== null,
  })
}

export function useFavoriteIds(): ReadonlySet<string> {
  const { data } = useFavorites()
  return useMemo(() => new Set(data?.map((nft) => nft.id) ?? []), [data])
}

/** Favoritar/desfavoritar com atualização otimista e rollback (ver `favoriteToggleOptions`). */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  return useMutation(favoriteToggleOptions(queryClient, user?.id))
}
