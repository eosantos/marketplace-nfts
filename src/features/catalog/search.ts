import { Decimal } from 'decimal.js'
import { z } from 'zod'
import {
  EthAmountSchema,
  NFT_PRICE_RANGE,
  NftCategorySchema,
  NftListTabSchema,
  NftNetworkSchema,
  NftOrderBySchema,
} from '@/shared/contracts'

export const CATALOG_PAGE_SIZE = 9

/**
 * Estado do catálogo na URL. Valores inválidos caem no padrão (`.catch`), nunca quebram a página.
 * Padrões (aba, ordenação, página 1) são removidos da URL por `stripSearchParams`.
 */
export const catalogSearchSchema = z.object({
  q: z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional()
    .catch(undefined),
  category: NftCategorySchema.optional().catch(undefined),
  network: NftNetworkSchema.optional().catch(undefined),
  minPrice: EthAmountSchema.optional().catch(undefined),
  maxPrice: EthAmountSchema.optional().catch(undefined),
  tab: NftListTabSchema.catch('todos'),
  orderBy: NftOrderBySchema.catch('recentes'),
  page: z.coerce.number().int().min(1).catch(1),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

export const CATALOG_SEARCH_DEFAULTS = { tab: 'todos', orderBy: 'recentes', page: 1 } as const

/** Converte o estado da URL nos parâmetros de `GET /nfts` (só o que foi definido). */
export function toListParams(search: CatalogSearch): Record<string, string> {
  const params: Record<string, string> = {
    tab: search.tab,
    orderBy: search.orderBy,
    page: String(search.page),
    pageSize: String(CATALOG_PAGE_SIZE),
  }
  if (search.q) params.q = search.q
  if (search.category) params.category = search.category
  if (search.network) params.network = search.network
  if (search.minPrice) params.minPrice = search.minPrice
  if (search.maxPrice) params.maxPrice = search.maxPrice
  return params
}

/** Quantidade de filtros ativos (sem contar aba, ordenação e página). */
export function activeFilterCount(search: CatalogSearch): number {
  const hasPrice = search.minPrice !== undefined || search.maxPrice !== undefined
  return [search.q, search.category, search.network].filter(Boolean).length + (hasPrice ? 1 : 0)
}

/** Janela de páginas exibida na paginação (até `size` números, sempre contendo a atual). */
export function getPageWindow(page: number, totalPages: number, size = 4): number[] {
  if (totalPages <= 0) return []
  const length = Math.min(size, totalPages)
  const start = Math.max(1, Math.min(page - 1, totalPages - length + 1))
  return Array.from({ length }, (_, index) => start + index)
}

// ---- Faixa de preço: o slider trabalha em centésimos de ETH (inteiros); o valor vai/volta como string ----

export const PRICE_MIN_CENTS = new Decimal(NFT_PRICE_RANGE.min).times(100).toNumber()
export const PRICE_MAX_CENTS = new Decimal(NFT_PRICE_RANGE.max).times(100).toNumber()

export function ethToCents(value: string): number {
  return new Decimal(value).times(100).round().toNumber()
}

export function centsToEth(cents: number): string {
  return new Decimal(cents).div(100).toFixed(2)
}

/** "0.02" -> "0,02" (formato da sidebar, como no Figma). */
export function formatEthPt(value: string): string {
  return new Decimal(value).toFixed(2).replace('.', ',')
}
