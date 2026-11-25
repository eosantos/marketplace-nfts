import { Decimal } from 'decimal.js'
import {
  NFT_PRICE_RANGE,
  NftCategorySchema,
  NftListParamsSchema,
  NftNetworkSchema,
  type FacetEntry,
  type Nft,
  type NftFacets,
  type NftListParams,
  type NftListResponse,
} from '@/shared/contracts'
import { getDb } from '../db'
import { fail, ok, validationFail, type ServiceResult } from '../http/result'

const DAY_MS = 24 * 60 * 60 * 1000
const NEW_RELEASE_WINDOW_DAYS = 10

function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR')
}

function sorter(orderBy: NftListParams['orderBy']): (a: Nft, b: Nft) => number {
  switch (orderBy) {
    case 'preco-asc':
      return (a, b) => new Decimal(a.price).cmp(b.price) || compareStrings(a.id, b.id)
    case 'preco-desc':
      return (a, b) => new Decimal(b.price).cmp(a.price) || compareStrings(a.id, b.id)
    case 'nome':
      return (a, b) => compareStrings(a.name, b.name) || compareStrings(a.id, b.id)
    case 'avaliacao':
      return (a, b) =>
        b.rating.score - a.rating.score ||
        b.rating.count - a.rating.count ||
        compareStrings(a.id, b.id)
    default:
      return (a, b) => b.createdAt.localeCompare(a.createdAt) || compareStrings(a.id, b.id)
  }
}

/** Lista NFTs com busca, filtros, abas, ordenação e paginação (parâmetros vêm da URL). */
export function listNfts(raw: Record<string, string>): ServiceResult<NftListResponse> {
  const cleaned = Object.fromEntries(Object.entries(raw).filter(([, value]) => value.trim() !== ''))
  const parsed = NftListParamsSchema.safeParse(cleaned)
  if (!parsed.success) return validationFail(parsed.error)

  const params = parsed.data
  const all = getDb().nfts
  const query = params.q ? normalize(params.q.trim()) : ''
  const latest = all.reduce((max, nft) => Math.max(max, new Date(nft.createdAt).getTime()), 0)
  const newSince = latest - NEW_RELEASE_WINDOW_DAYS * DAY_MS

  const filtered = all.filter((nft) => {
    if (query && !normalize(`${nft.name} ${nft.collection} ${nft.tokenId}`).includes(query)) {
      return false
    }
    if (params.collection && nft.collection !== params.collection) return false
    if (params.category && nft.category !== params.category) return false
    if (params.network && nft.network !== params.network) return false
    if (params.rarity && nft.rarity !== params.rarity) return false
    if (params.minPrice && new Decimal(nft.price).lt(params.minPrice)) return false
    if (params.maxPrice && new Decimal(nft.price).gt(params.maxPrice)) return false
    if (params.tab === 'novos' && new Date(nft.createdAt).getTime() < newSince) return false
    if (params.tab === 'em-alta' && !(nft.rating.score >= 4.8 && nft.rating.count >= 100)) {
      return false
    }
    return true
  })

  const sorted = [...filtered].sort(sorter(params.orderBy))
  const start = (params.page - 1) * params.pageSize

  return ok({
    items: sorted.slice(start, start + params.pageSize),
    page: params.page,
    pageSize: params.pageSize,
    total: sorted.length,
  })
}

export function getNft(id: string): ServiceResult<Nft> {
  const nft = getDb().nfts.find((candidate) => candidate.id === id)
  return nft ? ok(nft) : fail('NOT_FOUND', 'NFT não encontrado.')
}

function countBy(nfts: Nft[], names: readonly string[], pick: (nft: Nft) => string): FacetEntry[] {
  return names.map((name) => ({
    name,
    count: nfts.filter((nft) => pick(nft) === name).length,
  }))
}

/** Contagens da sidebar (categorias, redes, coleções) e faixa de preço de referência. */
export function getFacets(): ServiceResult<NftFacets> {
  const nfts = getDb().nfts
  const collections = [...new Set(nfts.map((nft) => nft.collection))].sort(compareStrings)

  return ok({
    categories: countBy(nfts, NftCategorySchema.options, (nft) => nft.category),
    networks: countBy(nfts, NftNetworkSchema.options, (nft) => nft.network),
    collections: countBy(nfts, collections, (nft) => nft.collection),
    priceRange: { min: NFT_PRICE_RANGE.min, max: NFT_PRICE_RANGE.max },
  })
}
