import { ShoppingCart } from 'lucide-react'
import { pickQuickAddEdition } from '@/features/nft/editions'
import type { Nft } from '@/shared/contracts'
import { useCartAdd } from '../hooks'

/**
 * Atalho do card: adiciona 1 unidade da primeira edição disponível (a aberta, se houver).
 * Quem quer escolher edição e quantidade usa a página de detalhe.
 */
export function QuickAddButton({ nft }: { nft: Nft }) {
  const cart = useCartAdd()
  const edition = pickQuickAddEdition(nft)

  return (
    <button
      type="button"
      aria-label={edition ? `Adicionar ${nft.name} ao carrinho` : `${nft.name} está esgotado`}
      disabled={!edition || cart.isPending}
      onClick={() => {
        if (edition) cart.add(nft, { nftId: nft.id, editionType: edition.type, quantity: 1 })
      }}
      className="flex h-9 w-9 items-center justify-center rounded bg-surface/90 text-foreground transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
