import { z } from 'zod'
import { FavoriteSchema, NftSchema, type Favorite, type Nft } from '@/shared/contracts'
import { http } from '@/shared/api/http'

export async function fetchFavorites(signal?: AbortSignal): Promise<Nft[]> {
  const response = await http.get<unknown>('/favorites', signal ? { signal } : {})
  return z.array(NftSchema).parse(response.data)
}

export async function addFavoriteRequest(nftId: string): Promise<Favorite> {
  const response = await http.post<unknown>('/favorites', { nftId })
  return FavoriteSchema.parse(response.data)
}

export async function removeFavoriteRequest(nftId: string): Promise<void> {
  await http.delete(`/favorites/${encodeURIComponent(nftId)}`)
}
