import { activeFilterCount, CATALOG_PAGE_SIZE, type CatalogSearch } from '../search'
import { useNftList } from '../hooks'
import { useCatalogNavigation } from '../use-catalog-navigation'
import { Pagination } from './pagination'
import { ResultsEmpty, ResultsError, ResultsGrid, ResultsSkeleton } from './results-grid'

/** Lista + estados (carregando, erro com retry, vazio) + paginação, tudo a partir da URL. */
export function CatalogResults({ search }: { search: CatalogSearch }) {
  const query = useNftList(search)
  const update = useCatalogNavigation()

  if (query.isPending) return <ResultsSkeleton />

  const data = query.data
  if (!data) {
    return (
      <ResultsError
        onRetry={() => {
          void query.refetch()
        }}
      />
    )
  }

  if (data.items.length === 0) {
    const hasFilters = activeFilterCount(search) > 0 || search.tab !== 'todos'
    return (
      <ResultsEmpty
        onClear={() => {
          update(
            hasFilters
              ? {
                  q: undefined,
                  category: undefined,
                  network: undefined,
                  minPrice: undefined,
                  maxPrice: undefined,
                  tab: 'todos',
                }
              : {},
          )
        }}
      />
    )
  }

  return (
    <>
      <ResultsGrid data={data} refreshing={query.isPlaceholderData} />
      <Pagination page={data.page} total={data.total} pageSize={CATALOG_PAGE_SIZE} />
    </>
  )
}
