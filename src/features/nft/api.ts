import { NftSchema, type Nft } from '@/shared/contracts'
import { http } from '@/shared/api/http'

export async function fetchNft(id: string, signal?: AbortSignal): Promise<Nft> {
  const response = await http.get<unknown>(`/nfts/${encodeURIComponent(id)}`, signal ? { signal } : {})
  return NftSchema.parse(response.data)
}
