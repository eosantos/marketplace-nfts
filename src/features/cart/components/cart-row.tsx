import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { maxQuantity } from '@/features/nft/editions'
import { useNft } from '@/features/nft/hooks'
import type { QuoteItem } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'
import { Stepper } from '@/shared/ui/stepper'
import { padEth } from '../format'
import { useCartLineActions, type CartLine } from '../hooks'
import { SkeletonImage } from '@/shared/ui/skeleton-image'

interface CartRowProps {
  line: CartLine
  /** Linha correspondente na cotação (preço unitário e total vêm do servidor). */
  quoteItem: QuoteItem | undefined
  quoteLoading: boolean
}

export const ROW_GRID = 'md:grid-cols-[1fr_110px_120px_110px_36px]'

/** Uma linha do carrinho: NFT, preço, quantidade (limitada pela edição), total e remoção. */
export function CartRow({ line, quoteItem, quoteLoading }: CartRowProps) {
  const nft = useNft(line.nftId)
  const actions = useCartLineActions(line)
  const [limitHit, setLimitHit] = useState(false)

  const data = nft.data
  const edition = data?.editions.find((candidate) => candidate.type === line.editionType)
  const max = maxQuantity(edition)
  const overStock = data !== undefined && line.quantity > max
  const name = data?.name ?? 'NFT'
  const unitPrice = quoteItem?.unitPrice ?? data?.price

  return (
    <li
      className={cn(
        'grid grid-cols-[70px_1fr_auto] items-center gap-x-4 gap-y-2 bg-surface p-3 md:gap-x-4',
        'md:grid-cols-[1fr_110px_120px_110px_36px]',
        'lg:grid-cols-[311px_139px_136px_1fr_20px] lg:gap-x-0 lg:bg-transparent lg:p-0',
        actions.isRemoving && 'opacity-50',
      )}
    >
      <div className="flex items-center gap-4 max-md:contents">
        {data ? (
          <SkeletonImage
            src={data.image}
            alt={`${data.name}, da coleção ${data.collection}`}
            width={70}
            height={70}
            loading="lazy"
            decoding="async"
            className="h-[70px] w-[70px] rounded-lg object-cover"
          />
        ) : (
          <Skeleton className="h-[70px] w-[70px]" />
        )}
        <div className="min-w-0">
          {data ? (
            <>
              <p className="truncate text-sm font-bold lg:text-base">{data.name}</p>
              <p className="text-xs text-muted-foreground">
                ID do token: {data.tokenId} · Edição: {line.editionType}
              </p>
            </>
          ) : nft.isError ? (
            <p className="text-sm text-danger">NFT indisponível</p>
          ) : (
            <>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1 h-3 w-40" />
            </>
          )}
        </div>
      </div>

      <div className="text-sm font-bold text-accent-strong max-md:col-start-2 max-md:row-start-2 lg:text-base">
        {unitPrice ? `${padEth(unitPrice)} ETH` : <Skeleton className="h-4 w-16" />}
      </div>

      <div className="max-md:col-start-3 max-md:row-start-2">
        <Stepper
          value={line.quantity}
          max={Math.max(max, line.quantity)}
          label={name}
          onChange={(quantity) => {
            setLimitHit(false)
            actions.setQuantity(quantity)
          }}
          onLimit={() => {
            setLimitHit(true)
          }}
        />
      </div>

      <div className="text-sm font-bold text-accent-strong max-md:hidden lg:text-base" aria-busy={quoteLoading && !quoteItem}>
        {quoteItem ? `${padEth(quoteItem.subtotal)} ETH` : quoteLoading ? <Skeleton className="h-4 w-16" /> : '—'}
      </div>

      <button
        type="button"
        aria-label={`Remover ${name} do carrinho`}
        disabled={actions.isRemoving}
        onClick={actions.remove}
        className="flex h-9 w-9 items-center justify-center text-accent lg:h-5 lg:w-5 lg:justify-self-end transition-opacity hover:opacity-80 max-md:col-start-3 max-md:row-start-1 max-md:self-start max-md:justify-self-end"
      >
        <Trash2 className="h-5 w-5" aria-hidden="true" />
      </button>

      {limitHit || overStock ? (
        <p
          role={overStock ? 'alert' : 'status'}
          className="col-span-full text-xs text-danger"
        >
          {overStock
            ? `Só há ${max} unidade${max === 1 ? '' : 's'} disponível${max === 1 ? '' : 'is'} nesta edição. Ajuste a quantidade para continuar.`
            : `Máximo de ${max} unidade${max === 1 ? '' : 's'} por compra nesta edição.`}
        </p>
      ) : null}
    </li>
  )
}
