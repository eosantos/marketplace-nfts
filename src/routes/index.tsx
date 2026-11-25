import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { CatalogResults } from '@/features/catalog/components/catalog-results'
import { CatalogTabs } from '@/features/catalog/components/catalog-tabs'
import { FeaturedNft } from '@/features/catalog/components/featured-nft'
import { FiltersPanel } from '@/features/catalog/components/filters-panel'
import { Hero } from '@/features/catalog/components/hero'
import { Journal } from '@/features/catalog/components/journal'
import { MobileSearchBar } from '@/features/catalog/components/mobile-search-bar'
import { PromoCards } from '@/features/catalog/components/promo-cards'
import { SortSelect } from '@/features/catalog/components/sort-select'
import { CATALOG_SEARCH_DEFAULTS, catalogSearchSchema } from '@/features/catalog/search'
import { MobileTabBar } from '@/shared/layout/mobile-tab-bar'
import { SiteFooter } from '@/shared/layout/site-footer'

export const Route = createFileRoute('/')({
  // Busca, filtros, aba, ordenação e página vivem na URL; valores inválidos voltam ao padrão.
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(CATALOG_SEARCH_DEFAULTS)] },
  component: HomePage,
})

function HomePage() {
  const search = Route.useSearch()

  return (
    <>
      <main className="mx-auto max-w-[1200px] px-5 pb-28 md:px-0 md:pb-0">
        <MobileSearchBar search={search} />
        <Hero />

        <div id="catalogo" className="mt-10 grid scroll-mt-6 gap-8 md:mt-14 md:grid-cols-[310px_1fr] lg:mt-24 lg:gap-12">
          <aside aria-label="Filtros" className="hidden content-start gap-6 md:grid">
            <FiltersPanel search={search} />
            <FeaturedNft />
          </aside>

          <section aria-labelledby="catalog-title">
            <h2 id="catalog-title" className="sr-only">
              Catálogo de NFTs
            </h2>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 md:mb-7">
              <CatalogTabs active={search.tab} />
              <div className="hidden md:block">
                <SortSelect value={search.orderBy} />
              </div>
            </div>
            <CatalogResults search={search} />
          </section>
        </div>

        <PromoCards />
        <Journal />
      </main>

      <SiteFooter />
      <MobileTabBar />
    </>
  )
}
