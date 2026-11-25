import { z } from 'zod'
import {
  ArticleSchema,
  NftFacetsSchema,
  NftListResponseSchema,
  type Article,
  type NftFacets,
  type NftListResponse,
} from '@/shared/contracts'
import { http } from '@/shared/api/http'

export async function fetchNfts(
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<NftListResponse> {
  const response = await http.get<unknown>('/nfts', { params, ...(signal ? { signal } : {}) })
  return NftListResponseSchema.parse(response.data)
}

export async function fetchFacets(signal?: AbortSignal): Promise<NftFacets> {
  const response = await http.get<unknown>('/nfts/facets', signal ? { signal } : {})
  return NftFacetsSchema.parse(response.data)
}

export async function fetchArticles(signal?: AbortSignal): Promise<Article[]> {
  const response = await http.get<unknown>('/articles', signal ? { signal } : {})
  return z.array(ArticleSchema).parse(response.data)
}
