import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchNfts } from '@/features/catalog/api'
import { qk } from '@/shared/api/query-keys'
import { fetchNft } from './api'

export function useNft(id: string) {
  return useQuery({
    queryKey: qk.nft(id),
    queryFn: ({ signal }) => fetchNft(id, signal),
  })
}

/** "Mais desta coleção": itens da mesma coleção (o chamador remove o NFT atual). */
export function useRelatedNfts(collection: string, page: number) {
  const params = { collection, tab: 'todos', orderBy: 'recentes', page: String(page), pageSize: '6' }
  return useQuery({
    queryKey: qk.nfts(params),
    queryFn: ({ signal }) => fetchNfts(params, signal),
    placeholderData: keepPreviousData,
  })
}
