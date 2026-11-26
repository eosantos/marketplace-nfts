import { Link } from '@tanstack/react-router'
import type { Quote } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'
import { padEth } from '@/features/cart/format'
import { SkeletonImage } from '@/shared/ui/skeleton-image'

interface OrderSummaryProps {
  quote: Quote | undefined
  loading: boolean
  refreshing: boolean
  coupon: string | null
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm lg:text-base">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/** "Seus NFTs" + totais. Todos os valores vêm da cotação do servidor (nada é somado no cliente). */
export function OrderSummary({ quote, loading, refreshing, coupon }: OrderSummaryProps) {
  return (
    <section aria-labelledby="your-nfts" className={cn('transition-opacity', refreshing && quote && 'opacity-60')} aria-busy={refreshing}>
      <h2 id="your-nfts" className="text-base font-bold lg:text-lg">
        Seus NFTs
      </h2>

      {quote ? (
        <>
          <div aria-hidden="true" className="mt-1 hidden justify-between text-sm font-bold lg:flex">
            <span>NFTs</span>
            <span>Subtotal</span>
          </div>
          <ul className="mt-3 grid gap-2 lg:mt-5 lg:gap-3">
            {quote.items.map((item) => (
              <li key={`${item.nftId}-${item.editionType}`} data-skel-group className="flex min-w-0 items-center gap-3 bg-surface p-2 lg:p-0 lg:pr-3">
                <SkeletonImage src={item.nftImage} alt="" width={64} height={64} loading="lazy" decoding="async" className="h-16 w-16 rounded-lg object-cover lg:h-[70px] lg:w-[70px]" />
                <div className="min-w-0 flex-1">
                  <p className="skel-text truncate text-sm font-bold lg:text-base">{item.nftName}</p>
                  <p className="skel-text text-xs text-muted-foreground lg:text-sm">
                    Edição: {item.editionType} · (x {item.quantity})
                  </p>
                </div>
                <p className="text-sm font-bold text-accent-strong lg:text-lg">{padEth(item.subtotal)} ETH</p>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-center text-xs lg:text-sm">
            {coupon ? (
              <>Cupom {coupon} aplicado.</>
            ) : (
              <>
                Tem um código promocional?{' '}
                <Link to="/cart" className="text-accent underline underline-offset-4 hover:no-underline">
                  Aplique no carrinho
                </Link>
              </>
            )}
          </p>

          <dl className="mt-4 grid gap-3 lg:gap-2">
            <Row label="Subtotal">{padEth(quote.subtotal)} ETH</Row>
            <Row label="Desconto do lançamento">(-) {padEth(quote.discount)}</Row>
            <Row label="Taxa de rede">{quote.networkFee} ETH</Row>
            <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd className="text-accent-strong lg:text-lg" data-testid="checkout-total">
                {quote.total} ETH
              </dd>
            </div>
          </dl>
        </>
      ) : loading ? (
        <div role="status" aria-label="Calculando resumo" className="mt-3 grid gap-3">
          <Skeleton className="h-[80px] w-full" />
          <Skeleton className="h-[80px] w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : null}
    </section>
  )
}
