import type { MutationObserverOptions, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { parseApiError } from '@/shared/api/errors'
import { qk } from '@/shared/api/query-keys'
import type { Nft } from '@/shared/contracts'
import { addFavoriteRequest, removeFavoriteRequest } from './api'

export interface ToggleInput {
  nftId: string
  favorite: boolean
  /** Necessário só para a atualização otimista ao favoritar. */
  nft?: Nft
}

export interface ToggleContext {
  key: ReturnType<typeof qk.favorites>
  previous: Nft[] | undefined
}

/** Aplica favoritar/desfavoritar a uma lista (usado na atualização otimista). */
export function applyFavorite(list: Nft[], { nftId, favorite, nft }: ToggleInput): Nft[] {
  if (!favorite) return list.filter((item) => item.id !== nftId)
  if (!nft || list.some((item) => item.id === nftId)) return list
  return [nft, ...list]
}

/**
 * Opções da mutation de favorito: a UI muda na hora (`onMutate`), o erro reverte e avisa por toast
 * (`onError`) e `onSettled` reconcilia com o servidor. Separadas do hook para serem testáveis.
 */
export function favoriteToggleOptions(
  queryClient: QueryClient,
  userId: string | undefined,
): MutationObserverOptions<void, Error, ToggleInput, ToggleContext | undefined> {
  return {
    mutationFn: async ({ nftId, favorite }) => {
      if (favorite) await addFavoriteRequest(nftId)
      else await removeFavoriteRequest(nftId)
    },

    onMutate: async (input): Promise<ToggleContext | undefined> => {
      if (!userId) return undefined
      const key = qk.favorites(userId)
      await queryClient.cancelQueries({ queryKey: key })
      // Sem cache ainda (lista carregando): reverter para vazio; o `onSettled` reconcilia com o servidor.
      const previous = queryClient.getQueryData<Nft[]>(key) ?? []
      queryClient.setQueryData<Nft[]>(key, (old) => applyFavorite(old ?? [], input))
      return { key, previous }
    },

    onSuccess: (_data, { favorite }) => {
      toast.success(favorite ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.')
    },

    onError: (error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous)
      toast.error(`Não foi possível atualizar seus favoritos. ${parseApiError(error).message}`)
    },

    onSettled: (_data, _error, _input, context) => {
      if (context) void queryClient.invalidateQueries({ queryKey: context.key })
    },
  }
}
