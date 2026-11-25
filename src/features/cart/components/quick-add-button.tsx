import { useRouter } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { useSession } from '@/features/auth/hooks'
import { currentHref, loginUrlFor, setPendingAction } from '@/features/auth/pending-action'
import { pickQuickAddEdition } from '@/features/nft/editions'
import type { Nft } from '@/shared/contracts'
import { useAddToCart } from '../hooks'

/**
 * Atalho do card: adiciona 1 unidade da primeira edição disponível (a aberta, se houver).
 * Quem quer escolher edição e quantidade usa a página de detalhe.
 */
export function QuickAddButton({ nft }: { nft: Nft }) {
  const router = useRouter()
  const { user } = useSession()
  const addToCart = useAddToCart()
  const edition = pickQuickAddEdition(nft)

  const onClick = () => {
    if (!edition) return
    const item = { nftId: nft.id, editionType: edition.type, quantity: 1 }

    if (!user) {
      setPendingAction({ type: 'add-to-cart', ...item, buyNow: false })
      router.history.push(loginUrlFor(currentHref()))
      return
    }
    addToCart.mutate(item)
  }

  return (
    <button
      type="button"
      aria-label={edition ? `Adicionar ${nft.name} ao carrinho` : `${nft.name} está esgotado`}
      disabled={!edition || addToCart.isPending}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded bg-surface/90 text-foreground transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
