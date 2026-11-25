import { Link } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { QuickAddButton } from '@/features/cart/components/quick-add-button'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import type { Nft } from '@/shared/contracts'
import { SkeletonImage } from '@/shared/ui/skeleton-image'

interface NftCardProps {
  nft: Nft
  /** Primeiras linhas da grade: imagem carregada de imediato (melhora o LCP). */
  priority?: boolean
}

/**
 * Card do catálogo. As ações (favoritar, carrinho, ver) ficam FORA do link, sobrepostas à imagem:
 * no desktop aparecem no hover/foco; no mobile só o coração, sempre visível (como no Figma).
 */
export function NftCard({ nft, priority = false }: NftCardProps) {
  return (
    <article className="group relative">
      <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="block">
        <div className="relative aspect-[258/300] bg-surface p-4 pb-3">
          {nft.rarity !== 'COMUM' ? (
            <span className="absolute left-0 top-0 bg-accent px-3 py-1 text-xs font-bold text-on-accent">
              {nft.rarity}
            </span>
          ) : null}
          <SkeletonImage
            src={nft.image}
            alt={`${nft.name}, da coleção ${nft.collection}`}
            width={258}
            height={300}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            className="h-full w-full rounded-2xl object-cover"
          />
        </div>
        <h3 className="mt-3 text-sm">{nft.name}</h3>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-bold text-accent-strong">{nft.price} ETH</span>
          {nft.oldPrice ? (
            <span className="text-sm text-muted-foreground line-through">{nft.oldPrice} ETH</span>
          ) : null}
        </p>
      </Link>

      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[258/300]">
        <FavoriteButton nft={nft} variant="round" className="pointer-events-auto absolute right-3 top-3 md:hidden" />
        <div className="pointer-events-auto absolute inset-x-0 bottom-3 hidden justify-center gap-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 md:flex">
          <QuickAddButton nft={nft} />
          <FavoriteButton nft={nft} variant="card" />
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            aria-label={`Ver detalhes de ${nft.name}`}
            className="flex h-9 w-9 items-center justify-center rounded bg-surface/90 text-foreground transition-colors hover:text-accent"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}
