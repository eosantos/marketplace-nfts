import { Link } from '@tanstack/react-router'
import type { Nft } from '@/shared/contracts'

interface NftCardProps {
  nft: Nft
  /** Primeiras linhas da grade: imagem carregada de imediato (melhora o LCP). */
  priority?: boolean
}

export function NftCard({ nft, priority = false }: NftCardProps) {
  return (
    <article>
      <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="block">
        <div className="relative aspect-[258/300] bg-surface p-4 pb-3">
          {nft.rarity !== 'COMUM' ? (
            <span className="absolute left-0 top-0 bg-accent px-3 py-1 text-xs font-bold text-on-accent">
              {nft.rarity}
            </span>
          ) : null}
          <img
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
    </article>
  )
}
