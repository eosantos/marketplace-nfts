import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchNfts } from '@/features/catalog/api'
import { NftCard } from '@/features/catalog/components/nft-card'
import { qk } from '@/shared/api/query-keys'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'

const VISIBLE = 5

/** "Colecionadores também viram": os mais bem avaliados que ainda não estão no carrinho. */
export function AlsoViewed({ excludeIds }: { excludeIds: ReadonlySet<string> }) {
  const [page, setPage] = useState(1)
  const params = { tab: 'em-alta', orderBy: 'avaliacao', page: String(page), pageSize: '10' }
  const query = useQuery({
    queryKey: qk.nfts(params),
    queryFn: ({ signal }) => fetchNfts(params, signal),
    placeholderData: keepPreviousData,
  })

  const items = (query.data?.items ?? []).filter((nft) => !excludeIds.has(nft.id)).slice(0, VISIBLE)
  const dots = Math.min(3, Math.ceil((query.data?.total ?? 0) / 10))

  if (query.isError) return null
  if (!query.isPending && items.length === 0) return null

  return (
    <section aria-labelledby="also-viewed-title" className="mt-16 hidden md:block">
      <h2 id="also-viewed-title" className="border-b border-border pb-3 text-base font-bold text-accent">
        Colecionadores também viram
      </h2>
      <ul className="mt-6 grid grid-cols-5 gap-6">
        {query.isPending
          ? Array.from({ length: VISIBLE }, (_, index) => (
              <li key={index}>
                <Skeleton className="aspect-[258/300] w-full rounded-none" />
                <Skeleton className="mt-3 h-4 w-3/4" />
              </li>
            ))
          : items.map((nft) => (
              <li key={nft.id}>
                <NftCard nft={nft} />
              </li>
            ))}
      </ul>
      {dots > 1 ? (
        <div role="group" aria-label="Páginas de sugestões" className="mt-6 flex justify-center gap-2">
          {Array.from({ length: dots }, (_, position) => (
            <button
              key={position}
              type="button"
              aria-label={`Página ${position + 1} de sugestões`}
              aria-current={page === position + 1 ? 'true' : undefined}
              onClick={() => {
                setPage(position + 1)
              }}
              className={cn('h-3 w-3 rounded-full border border-accent', page === position + 1 ? 'bg-accent' : 'bg-transparent')}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
