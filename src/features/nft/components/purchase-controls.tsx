import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { Decimal } from 'decimal.js'
import type { Nft } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'
import { availabilityMessage } from '../editions'
import type { NftPurchase } from '../use-nft-purchase'

export function EditionPicker({ nft, purchase }: { nft: Nft; purchase: NftPurchase }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-bold lg:text-[15px]">Edição:</legend>
      <div className="flex flex-wrap gap-2">
        {nft.editions.map((edition) => {
          const soldOut = edition.available <= 0
          return (
            <label key={edition.type} className={cn('relative', soldOut && 'cursor-not-allowed')}>
              <input
                type="radio"
                name={`edition-${nft.id}`}
                value={edition.type}
                checked={edition.type === purchase.editionType}
                disabled={soldOut}
                onChange={() => {
                  purchase.selectEdition(edition.type)
                }}
                className="peer sr-only"
              />
              <span
                className={cn(
                  'block rounded-full border px-3 py-1 text-xs transition-colors lg:px-2',
                  'peer-checked:border-accent peer-checked:text-accent peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
                  soldOut ? 'border-border text-muted-foreground/60 line-through' : 'border-border hover:border-accent',
                )}
              >
                {edition.type}
                {soldOut ? <span className="sr-only"> (esgotada)</span> : null}
              </span>
            </label>
          )
        })}
      </div>
      <p role="status" className="mt-2 text-xs text-muted-foreground">
        {purchase.limitHit
          ? `Limite atingido: máximo de ${purchase.max} unidade${purchase.max === 1 ? '' : 's'} por compra.`
          : availabilityMessage(purchase.edition)}
      </p>
    </fieldset>
  )
}

export function QuantityStepper({ purchase }: { purchase: NftPurchase }) {
  const atMax = purchase.quantity >= purchase.max

  return (
    <div role="group" aria-label="Quantidade" className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        disabled={purchase.quantity <= 1 || purchase.soldOut}
        onClick={purchase.decrement}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-on-accent transition-opacity disabled:opacity-40 lg:h-8 lg:w-8"
      >
        <Minus className="h-5 w-5" aria-hidden="true" />
      </button>
      <output aria-live="polite" className="w-6 text-center text-sm lg:text-lg">
        {purchase.soldOut ? 0 : purchase.quantity}
      </output>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        aria-disabled={atMax}
        disabled={purchase.soldOut}
        onClick={purchase.increment}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full bg-accent text-on-accent transition-opacity disabled:opacity-40 lg:h-8 lg:w-8',
          atMax && !purchase.soldOut && 'opacity-60',
        )}
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )
}

/** Controles de compra do desktop: quantidade, COMPRAR e Favoritar. */
export function DesktopPurchaseRow({ nft, purchase }: { nft: Nft; purchase: NftPurchase }) {
  return (
    <div className="mt-5 hidden items-center justify-between gap-4 md:flex">
      <QuantityStepper purchase={purchase} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={purchase.soldOut || purchase.isPending}
          onClick={() => {
            purchase.submit(true)
          }}
          className="h-10 rounded bg-accent px-8 text-xs font-bold uppercase lg:w-[130px] lg:px-0 lg:text-sm text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {purchase.isPending ? 'Adicionando...' : 'Comprar'}
        </button>
        <FavoriteButton nft={nft} variant="detail" />
      </div>
    </div>
  )
}

/** Barra fixa de compra do mobile: quantidade, preço total, "Comprar NFT" e carrinho. */
export function MobilePurchaseBar({ nft, purchase }: { nft: Nft; purchase: NftPurchase }) {
  const total = new Decimal(nft.price).times(purchase.soldOut ? 1 : purchase.quantity).toFixed(2)

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 grid gap-3 rounded-t-3xl bg-surface p-4 md:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Qtd.</span>
          <QuantityStepper purchase={purchase} />
        </div>
        <p className="text-lg font-bold text-accent-strong">{total} ETH</p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={purchase.soldOut || purchase.isPending}
          onClick={() => {
            purchase.submit(true)
          }}
          className="h-12 flex-1 rounded-xl bg-gradient-to-r from-accent to-[#a8703f] text-sm font-bold text-on-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {purchase.soldOut ? 'Esgotado' : 'Comprar NFT'}
        </button>
        <button
          type="button"
          aria-label="Adicionar ao carrinho"
          disabled={purchase.soldOut || purchase.isPending}
          onClick={() => {
            purchase.submit(false)
          }}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-border text-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
