import { useState } from 'react'
import { ArrowLeft, ZoomIn } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import type { Nft } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { SkeletonImage } from '@/shared/ui/skeleton-image'

/** Miniaturas (desktop) + imagem principal com zoom. Renderiza duas células da grade do detalhe. */
export function Gallery({ nft }: { nft: Nft }) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const image = nft.gallery[index] ?? nft.image
  const thumbs = nft.gallery.slice(0, 4)

  return (
    <>
      <div className="hidden flex-col gap-4 md:flex">
        {thumbs.map((source, position) => (
          <button
            key={`${source}-${position}`}
            type="button"
            aria-label={`Ver imagem ${position + 1} de ${thumbs.length}`}
            aria-pressed={position === index}
            onClick={() => {
              setIndex(position)
            }}
            className={cn(
              'overflow-hidden rounded-lg border-2 transition-colors',
              position === index ? 'border-accent' : 'border-transparent hover:border-border',
            )}
          >
            <SkeletonImage src={source} alt="" width={100} height={100} decoding="async" className="aspect-square w-full object-cover" />
          </button>
        ))}
      </div>

      <div className="relative bg-surface p-0 md:self-start md:p-5">
        <SkeletonImage
          src={image}
          alt={`${nft.name}, da coleção ${nft.collection}`}
          width={404}
          height={404}
          fetchPriority="high"
          decoding="async"
          className="aspect-square w-full rounded-2xl object-cover"
        />

        <button
          type="button"
          aria-label="Voltar"
          onClick={() => {
            router.history.back()
          }}
          className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/90 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <FavoriteButton nft={nft} variant="round" className="absolute right-3 top-3 md:hidden" />

        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Ampliar imagem"
              className="absolute right-8 top-8 hidden h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-foreground transition-colors hover:text-accent md:flex"
            >
              <ZoomIn className="h-4 w-4" aria-hidden="true" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl border-border bg-surface p-3">
            <DialogTitle className="sr-only">{nft.name}</DialogTitle>
            <DialogDescription className="sr-only">Imagem ampliada de {nft.name}.</DialogDescription>
            <SkeletonImage src={image} alt={nft.name} className="max-h-[80vh] w-full rounded-xl object-contain" />
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
