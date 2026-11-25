import { Star } from 'lucide-react'
import type { NftRating } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'

export function StarRating({ rating, className }: { rating: NftRating; className?: string }) {
  const filled = Math.round(rating.score)

  return (
    <p
      role="img"
      className={cn('flex items-center gap-1 text-xs lg:text-[15px]', className)}
      aria-label={`Nota ${rating.score.toFixed(1)} de 5, ${rating.count} avaliações de colecionadores`}
    >
      <span className="flex" aria-hidden="true">
        {Array.from({ length: 5 }, (_, position) => (
          <Star key={position} className={cn('h-3.5 w-3.5 text-accent lg:h-4 lg:w-4', position < filled && 'fill-accent')} />
        ))}
      </span>
      <span aria-hidden="true">{rating.count} avaliações de colecionadores</span>
    </p>
  )
}
