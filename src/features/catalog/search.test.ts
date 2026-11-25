import { describe, expect, it } from 'vitest'
import {
  activeFilterCount,
  catalogSearchSchema,
  centsToEth,
  CATALOG_PAGE_SIZE,
  ethToCents,
  formatEthPt,
  getPageWindow,
  PRICE_MAX_CENTS,
  PRICE_MIN_CENTS,
  toListParams,
} from './search'

describe('catalogSearchSchema', () => {
  it('uses defaults for an empty url', () => {
    const search = catalogSearchSchema.parse({})
    expect(search.tab).toBe('todos')
    expect(search.orderBy).toBe('recentes')
    expect(search.page).toBe(1)
    expect(search.q).toBeUndefined()
    expect(search.category).toBeUndefined()
  })

  it('falls back to defaults on invalid values instead of throwing', () => {
    const search = catalogSearchSchema.parse({
      tab: 'invalida',
      orderBy: 'caos',
      page: '-3',
      category: 'Marte',
      network: 'Lua',
      minPrice: 'abc',
      maxPrice: '1,5',
    })
    expect(search.tab).toBe('todos')
    expect(search.orderBy).toBe('recentes')
    expect(search.page).toBe(1)
    expect(search.category).toBeUndefined()
    expect(search.network).toBeUndefined()
    expect(search.minPrice).toBeUndefined()
    expect(search.maxPrice).toBeUndefined()
  })

  it('keeps valid values, coerces the page and trims the query', () => {
    const search = catalogSearchSchema.parse({
      q: '  ape  ',
      category: 'Arte 3D',
      network: 'Polygon',
      minPrice: '0.5',
      maxPrice: '3.00',
      tab: 'em-alta',
      orderBy: 'preco-desc',
      page: '4',
    })
    expect(search.q).toBe('ape')
    expect(search.category).toBe('Arte 3D')
    expect(search.network).toBe('Polygon')
    expect(search.minPrice).toBe('0.5')
    expect(search.maxPrice).toBe('3.00')
    expect(search.tab).toBe('em-alta')
    expect(search.orderBy).toBe('preco-desc')
    expect(search.page).toBe(4)
  })

  it('treats an empty query as absent', () => {
    expect(catalogSearchSchema.parse({ q: '   ' }).q).toBeUndefined()
  })
})

describe('toListParams and filter count', () => {
  it('sends only the defined filters and the page size', () => {
    const base = catalogSearchSchema.parse({})
    expect(toListParams(base)).toEqual({
      tab: 'todos',
      orderBy: 'recentes',
      page: '1',
      pageSize: String(CATALOG_PAGE_SIZE),
    })

    const filtered = catalogSearchSchema.parse({ q: 'ape', network: 'Solana', minPrice: '0.5', page: '2' })
    const params = toListParams(filtered)
    expect(params.q).toBe('ape')
    expect(params.network).toBe('Solana')
    expect(params.minPrice).toBe('0.5')
    expect(params.page).toBe('2')
    expect(params.maxPrice).toBeUndefined()
    expect(params.category).toBeUndefined()
  })

  it('counts active filters, with price counting once', () => {
    expect(activeFilterCount(catalogSearchSchema.parse({}))).toBe(0)
    expect(
      activeFilterCount(catalogSearchSchema.parse({ q: 'x', category: 'Música', minPrice: '1', maxPrice: '2' })),
    ).toBe(3)
  })
})

describe('getPageWindow', () => {
  it('always contains the current page within bounds', () => {
    expect(getPageWindow(1, 7)).toEqual([1, 2, 3, 4])
    expect(getPageWindow(4, 7)).toEqual([3, 4, 5, 6])
    expect(getPageWindow(7, 7)).toEqual([4, 5, 6, 7])
    expect(getPageWindow(2, 3)).toEqual([1, 2, 3])
    expect(getPageWindow(1, 1)).toEqual([1])
    expect(getPageWindow(1, 0)).toEqual([])
  })
})

describe('price helpers', () => {
  it('converts between ETH strings and integer hundredths', () => {
    expect(PRICE_MIN_CENTS).toBe(2)
    expect(PRICE_MAX_CENTS).toBe(1230)
    expect(ethToCents('0.02')).toBe(2)
    expect(ethToCents('12.30')).toBe(1230)
    expect(ethToCents('1.19')).toBe(119)
    expect(centsToEth(119)).toBe('1.19')
    expect(centsToEth(5)).toBe('0.05')
    expect(centsToEth(100)).toBe('1.00')
  })

  it('formats like the Figma sidebar (comma, two decimals)', () => {
    expect(formatEthPt('0.02')).toBe('0,02')
    expect(formatEthPt('12.3')).toBe('12,30')
  })
})
