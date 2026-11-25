import { Skeleton } from '@/shared/ui/skeleton'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import type { NftListResponse } from '@/shared/contracts'
import { CATALOG_PAGE_SIZE } from '../search'
import { NftCard } from './nft-card'

const GRID_CLASS =
  'grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-8 md:gap-y-10 max-md:[&>li:nth-child(even)]:mt-10'

/** Esqueleto com as mesmas dimensões dos cards (sem salto de layout ao carregar). */
export function ResultsSkeleton() {
  return (
    <div role="status" aria-label="Carregando NFTs">
      <ul className={GRID_CLASS}>
        {Array.from({ length: CATALOG_PAGE_SIZE }, (_, index) => (
          <li key={index}>
            <Skeleton className="aspect-[258/300] w-full rounded-none" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/3" />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ResultsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="grid justify-items-center gap-4 bg-surface px-6 py-16 text-center">
      <p className="font-bold">Não foi possível carregar os NFTs.</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Verifique sua conexão e tente novamente.
      </p>
      <Button onClick={onRetry}>Tentar novamente</Button>
    </div>
  )
}

export function ResultsEmpty({ onClear }: { onClear: () => void }) {
  return (
    <div className="grid justify-items-center gap-4 bg-surface px-6 py-16 text-center">
      <p className="font-bold">Nenhum NFT encontrado.</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Ajuste a busca ou remova alguns filtros para ver mais resultados.
      </p>
      <Button variant="outline" onClick={onClear}>
        Limpar filtros
      </Button>
    </div>
  )
}

interface ResultsGridProps {
  data: NftListResponse
  /** Verdadeiro enquanto uma nova página/filtro carrega e a lista anterior continua visível. */
  refreshing: boolean
}

export function ResultsGrid({ data, refreshing }: ResultsGridProps) {
  return (
    <div aria-busy={refreshing} className={cn('transition-opacity', refreshing && 'opacity-60')}>
      <p role="status" className="sr-only">
        {refreshing ? 'Atualizando resultados' : `${data.total} NFTs encontrados`}
      </p>
      <ul className={GRID_CLASS}>
        {data.items.map((nft, index) => (
          <li key={nft.id}>
            <NftCard nft={nft} priority={index < 3} />
          </li>
        ))}
      </ul>
    </div>
  )
}
