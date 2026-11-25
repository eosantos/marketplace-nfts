import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/shared/ui/skeleton'
import { useFeaturedNft } from '../hooks'

/** Faixa "NFT em destaque / Oferta limitada" abaixo dos filtros. */
export function FeaturedNft() {
  const { data: nft, isPending } = useFeaturedNft()

  if (isPending) return <Skeleton className="h-[460px] w-full rounded-none" />
  if (!nft) return null

  return (
    <section aria-labelledby="featured-title" className="bg-surface">
      <div className="px-5 pb-3 pt-5">
        <h2 id="featured-title" className="text-xl font-bold text-accent">
          NFT EM DESTAQUE
        </h2>
        <p className="mt-1 text-center text-lg font-bold">OFERTA LIMITADA</p>
      </div>
      <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="block">
        <img
          src={nft.image}
          alt={`${nft.name}, da coleção ${nft.collection}`}
          width={310}
          height={310}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full rounded-2xl object-cover"
        />
        <div className="flex items-baseline justify-between px-5 py-4 text-sm">
          <span>{nft.name}</span>
          <span className="font-bold text-accent-strong">{nft.price} ETH</span>
        </div>
      </Link>
    </section>
  )
}
