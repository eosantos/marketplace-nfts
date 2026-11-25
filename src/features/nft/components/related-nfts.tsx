import { useState } from 'react'
import { NftCard } from '@/features/catalog/components/nft-card'
import type { Nft } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'
import { useRelatedNfts } from '../hooks'

const VISIBLE = 5
const MAX_DOTS = 3

/** "Mais desta coleção": até 5 itens da mesma coleção, paginados pelos pontos. */
export function RelatedNfts({ nft }: { nft: Nft }) {
  const [page, setPage] = useState(1)
  const query = useRelatedNfts(nft.collection, page)

  const items = (query.data?.items ?? []).filter((item) => item.id !== nft.id).slice(0, VISIBLE)
  const dots = Math.min(MAX_DOTS, Math.ceil((query.data?.total ?? 0) / 6))

  if (query.isError) return null
  if (!query.isPending && items.length === 0 && page === 1) return null

  return (
    <section aria-labelledby="related-title" className="mt-16 hidden md:block">
      <h2 id="related-title" className="border-b border-border pb-3 text-base font-bold text-accent">
        Mais desta coleção
      </h2>

      <ul className="mt-6 grid grid-cols-5 gap-6" aria-busy={query.isPlaceholderData}>
        {query.isPending
          ? Array.from({ length: VISIBLE }, (_, index) => (
              <li key={index}>
                <Skeleton className="aspect-[258/300] w-full rounded-none" />
                <Skeleton className="mt-3 h-4 w-3/4" />
              </li>
            ))
          : items.map((item) => (
              <li key={item.id}>
                <NftCard nft={item} />
              </li>
            ))}
      </ul>

      {dots > 1 ? (
        <div role="group" aria-label="Páginas de coleção" className="mt-6 flex justify-center">
          {Array.from({ length: dots }, (_, position) => (
            <button
              key={position}
              type="button"
              aria-label={`Página ${position + 1} da coleção`}
              aria-current={page === position + 1 ? 'true' : undefined}
              onClick={() => {
                setPage(position + 1)
              }}
              // Alvo de toque de 24 px; o ponto visível continua com 12 px.
              className="flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'h-3 w-3 rounded-full border border-accent transition-colors',
                  page === position + 1 ? 'bg-accent' : 'bg-transparent',
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}
