import { NftCategorySchema, NftNetworkSchema } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'
import { useFacets } from '../hooks'
import type { CatalogSearch } from '../search'
import { useCatalogNavigation } from '../use-catalog-navigation'
import { PriceFilter } from './price-filter'

interface FilterRowProps {
  label: string
  count: number
  selected: boolean
  onToggle: () => void
}

function FilterRow({ label, count, selected, onToggle }: FilterRowProps) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onToggle}
        className={cn(
          'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:text-accent',
          selected ? 'font-bold text-accent' : 'text-muted-foreground',
        )}
      >
        <span>{label}</span>
        <span className="font-bold text-foreground">({count})</span>
      </button>
    </li>
  )
}

/** Sidebar de filtros: categorias ("Coleções"), faixa de preço e rede. Reutilizada no drawer mobile. */
export function FiltersPanel({ search }: { search: CatalogSearch }) {
  const facets = useFacets()
  const update = useCatalogNavigation()

  const countOf = (entries: { name: string; count: number }[], name: string) =>
    entries.find((entry) => entry.name === name)?.count ?? 0

  return (
    <div className="grid gap-8 bg-surface p-5">
      <section aria-labelledby="filter-categories">
        <h2 id="filter-categories" className="mb-3 text-base font-bold">
          Coleções
        </h2>
        {facets.data ? (
          <ul>
            {NftCategorySchema.options.map((category) => {
              const selected = search.category === category
              return (
                <FilterRow
                  key={category}
                  label={category}
                  count={countOf(facets.data.categories, category)}
                  selected={selected}
                  onToggle={() => {
                    update({ category: selected ? undefined : category })
                  }}
                />
              )
            })}
          </ul>
        ) : facets.isError ? (
          <p role="alert" className="text-xs text-danger">
            Não foi possível carregar as coleções.
          </p>
        ) : (
          <div className="grid gap-2" role="status" aria-label="Carregando coleções">
            {Array.from({ length: 9 }, (_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="filter-price">
        <h2 id="filter-price" className="mb-4 text-base font-bold">
          Faixa de preço
        </h2>
        <PriceFilter
          key={`${search.minPrice ?? ''}-${search.maxPrice ?? ''}`}
          minPrice={search.minPrice}
          maxPrice={search.maxPrice}
          onApply={(range) => {
            update(range)
          }}
        />
      </section>

      <section aria-labelledby="filter-network">
        <h2 id="filter-network" className="mb-3 text-base font-bold">
          Rede
        </h2>
        {facets.data ? (
          <ul>
            {NftNetworkSchema.options.map((network) => {
              const selected = search.network === network
              return (
                <FilterRow
                  key={network}
                  label={network}
                  count={countOf(facets.data.networks, network)}
                  selected={selected}
                  onToggle={() => {
                    update({ network: selected ? undefined : network })
                  }}
                />
              )
            })}
          </ul>
        ) : (
          <div className="grid gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
