import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { qk } from '@/shared/api/query-keys'
import { fetchArticles, fetchFacets, fetchNfts } from './api'
import { toListParams, type CatalogSearch } from './search'

/**
 * Lista do catálogo. A chave contém todos os parâmetros; o AbortSignal cancela buscas obsoletas
 * e `keepPreviousData` mantém a lista anterior na tela enquanto a nova carrega.
 */
export function useNftList(search: CatalogSearch) {
  const params = toListParams(search)
  return useQuery({
    queryKey: qk.nfts(params),
    queryFn: ({ signal }) => fetchNfts(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useFacets() {
  return useQuery({
    queryKey: qk.facets,
    queryFn: ({ signal }) => fetchFacets(signal),
    staleTime: 5 * 60_000,
  })
}

const FEATURED_PARAMS = { tab: 'em-alta', orderBy: 'avaliacao', page: '1', pageSize: '1' }

/** NFT da faixa "NFT em destaque / Oferta limitada" da sidebar. */
export function useFeaturedNft() {
  return useQuery({
    queryKey: qk.nfts(FEATURED_PARAMS),
    queryFn: ({ signal }) => fetchNfts(FEATURED_PARAMS, signal),
    select: (data) => data.items[0],
    staleTime: 5 * 60_000,
  })
}

export function useArticles() {
  return useQuery({
    queryKey: ['articles'] as const,
    queryFn: ({ signal }) => fetchArticles(signal),
    staleTime: 10 * 60_000,
  })
}
