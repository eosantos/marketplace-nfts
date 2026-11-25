import { useRouter } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useSession } from '@/features/auth/hooks'
import { currentHref, loginUrlFor, setPendingAction } from '@/features/auth/pending-action'
import type { Nft } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'
import { useFavoriteIds, useToggleFavorite } from '../hooks'

interface FavoriteButtonProps {
  nft: Nft
  /** card = quadrado do hover · round = círculo do mobile · detail = botão com texto. */
  variant: 'card' | 'round' | 'detail'
  className?: string
}

/**
 * Favoritar com atualização otimista. Visitante vai ao login e a ação é executada ao voltar.
 * O estado vem do cache (`favorites`), então fica coerente entre catálogo, detalhe e relacionados.
 */
export function FavoriteButton({ nft, variant, className }: FavoriteButtonProps) {
  const router = useRouter()
  const { user } = useSession()
  const favoriteIds = useFavoriteIds()
  const toggle = useToggleFavorite()
  const favorite = favoriteIds.has(nft.id)

  const onClick = () => {
    if (!user) {
      setPendingAction({ type: 'favorite', nftId: nft.id })
      router.history.push(loginUrlFor(currentHref()))
      return
    }
    toggle.mutate({ nftId: nft.id, favorite: !favorite, nft })
  }

  const label = favorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`
  const icon = (
    <Heart className={cn('h-5 w-5', favorite && 'fill-accent text-accent')} aria-hidden="true" />
  )

  if (variant === 'detail') {
    return (
      <button
        type="button"
        aria-pressed={favorite}
        onClick={onClick}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded border border-accent px-4 text-xs font-bold text-accent transition-colors hover:bg-accent/10',
          className,
        )}
      >
        {icon}
        {favorite ? 'Favoritado' : 'Favoritar'}
      </button>
    )
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={favorite}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center bg-surface/90 text-foreground transition-colors hover:text-accent',
        variant === 'card' ? 'h-9 w-9 rounded' : 'h-10 w-10 rounded-full border border-border',
        className,
      )}
    >
      {icon}
    </button>
  )
}
