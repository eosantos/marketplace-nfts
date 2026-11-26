import { Search, SlidersHorizontal } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet'
import { activeFilterCount, type CatalogSearch } from '../search'
import { useUrlSearchQuery } from '../use-url-search-query'
import { FiltersPanel } from './filters-panel'
import { SortSelect } from './sort-select'

/** Busca e drawer de filtros do mobile (no desktop a sidebar e o header cumprem esse papel). */
export function MobileSearchBar({ search }: { search: CatalogSearch }) {
  const { value, setValue } = useUrlSearchQuery()
  const filters = activeFilterCount(search) - (search.q ? 1 : 0)

  return (
    <div className="mb-4 mt-4 flex items-center gap-[7px] md:hidden">
      <label className="relative block flex-1">
        <span className="sr-only">Buscar NFTs</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-accent" aria-hidden="true" />
        <input
          type="search"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
          }}
          placeholder="Explorar coleções"
          className="h-[46px] w-full rounded-xl bg-surface pl-12 pr-4 text-sm placeholder:font-bold placeholder:text-accent/80 focus-visible:outline-accent"
        />
      </label>

      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label={filters > 0 ? `Abrir filtros, ${filters} ativos` : 'Abrir filtros'}
            className="relative flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-gradient-to-b from-accent to-[#a8703f] text-on-accent"
          >
            <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            {filters > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-foreground">
                {filters}
              </span>
            ) : null}
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto bg-background p-0">
          <SheetHeader className="p-4 text-left">
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription className="sr-only">
              Filtre os NFTs por coleção, faixa de preço e rede.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 px-4 pb-8">
            <SortSelect value={search.orderBy} />
            <FiltersPanel search={search} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
