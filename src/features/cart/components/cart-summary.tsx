import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { UseQueryResult } from '@tanstack/react-query'
import { parseApiError } from '@/shared/api/errors'
import type { Quote } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/skeleton'
import { padEth } from '../format'

interface CartSummaryProps {
  quote: UseQueryResult<Quote>
  isGuest: boolean
  appliedCoupon: string | null
  onApplyCoupon: (code: string) => Promise<string | null>
  onRemoveCoupon: () => void
}

function CouponForm({
  appliedCoupon,
  onApply,
  onRemove,
}: {
  appliedCoupon: string | null
  onApply: (code: string) => Promise<string | null>
  onRemove: () => void
}) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const submit = async () => {
    const trimmed = code.trim()
    if (!trimmed) {
      setError('Digite o código promocional.')
      return
    }
    setPending(true)
    setError(null)
    const message = await onApply(trimmed)
    setPending(false)
    if (message) setError(message)
    else setCode('')
  }

  return (
    <div>
      <label htmlFor="coupon-code" className="text-xs font-bold">
        Código promocional
      </label>

      {appliedCoupon ? (
        <div className="mt-2 flex items-center justify-between border border-accent px-3 py-2 text-xs">
          <span>Cupom {appliedCoupon} aplicado</span>
          <button type="button" onClick={onRemove} className="text-accent underline-offset-4 hover:underline">
            Remover
          </button>
        </div>
      ) : (
        <form
          noValidate
          className="mt-2 flex"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <Input
            id="coupon-code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value)
              setError(null)
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'coupon-error' : undefined}
            placeholder="Digite o código promocional..."
            className="h-10 rounded-none border-accent bg-transparent text-xs focus-visible:ring-0"
          />
          <Button type="submit" disabled={pending} className="h-10 rounded-none px-4 text-sm font-bold">
            {pending ? '...' : 'Aplicar'}
          </Button>
        </form>
      )}

      {error ? (
        <p id="coupon-error" role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function Row({ label, children, caption }: { label: string; children: React.ReactNode; caption?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt>{label}</dt>
      <dd className="text-right">
        {children}
        {caption ? <span className="block text-[10px] text-accent">{caption}</span> : null}
      </dd>
    </div>
  )
}

/** Resumo da carteira: todos os valores vêm da cotação do servidor, nunca de soma no cliente. */
export function CartSummary({ quote, isGuest, appliedCoupon, onApplyCoupon, onRemoveCoupon }: CartSummaryProps) {
  const data = quote.data
  const error = quote.isError ? parseApiError(quote.error) : null
  const couponProblem = error && (error.code === 'COUPON_INVALID' || error.code === 'COUPON_EXPIRED')
  const refreshing = quote.isPlaceholderData || quote.isFetching
  const canCheckout = isGuest || (data !== undefined && !error)

  return (
    <aside aria-labelledby="summary-title" className="bg-surface p-5 max-md:rounded-t-3xl md:bg-transparent md:p-0">
      <h2 id="summary-title" className="border-b border-border pb-3 text-base font-bold md:text-lg">
        Resumo da carteira
      </h2>

      <div className="mt-4">
        <CouponForm appliedCoupon={appliedCoupon} onApply={onApplyCoupon} onRemove={onRemoveCoupon} />
      </div>

      {isGuest ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Entre na sua conta para ver o resumo com taxas e finalizar a compra. Seus itens serão mantidos.
        </p>
      ) : error ? (
        <div role="alert" className="mt-6 grid gap-3 border border-danger/50 p-4 text-sm">
          <p>{error.message}</p>
          {couponProblem ? (
            <button type="button" onClick={onRemoveCoupon} className="justify-self-start text-accent underline-offset-4 hover:underline">
              Remover cupom
            </button>
          ) : error.code === 'AVAILABILITY_CONFLICT' || error.code === 'NOT_FOUND' ? (
            <p className="text-xs text-muted-foreground">Ajuste ou remova os itens indicados para continuar.</p>
          ) : (
            <button
              type="button"
              onClick={() => {
                void quote.refetch()
              }}
              className="justify-self-start text-accent underline-offset-4 hover:underline"
            >
              Tentar novamente
            </button>
          )}
        </div>
      ) : (
        <dl aria-busy={refreshing} className={cn('mt-6 grid gap-3 transition-opacity', refreshing && data && 'opacity-60')}>
          {data ? (
            <>
              <Row label="Subtotal">{padEth(data.subtotal)} ETH</Row>
              <Row label="Desconto do lançamento">(-) {padEth(data.discount)}</Row>
              <Row label="Taxa de rede" caption="Taxa estimada">
                {data.networkFee} ETH
              </Row>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-4 text-base font-bold">
                <dt>Total</dt>
                <dd className="text-accent-strong" data-testid="cart-total">
                  {data.total} ETH
                </dd>
              </div>
            </>
          ) : (
            <div role="status" aria-label="Calculando resumo" className="grid gap-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="mt-2 h-6 w-full" />
            </div>
          )}
        </dl>
      )}

      {canCheckout ? (
        <Button asChild size="lg" className="mt-6 w-full rounded-none font-bold max-md:h-12 max-md:rounded-xl max-md:bg-gradient-to-r max-md:from-accent max-md:to-[#a8703f]">
          <Link to="/checkout">{isGuest ? 'Entrar e finalizar' : 'Conectar e finalizar'}</Link>
        </Button>
      ) : (
        <Button size="lg" disabled className="mt-6 w-full rounded-none font-bold max-md:h-12 max-md:rounded-xl">
          Conectar e finalizar
        </Button>
      )}

      <Link to="/" className="mt-4 block text-center text-sm text-accent underline-offset-4 hover:underline">
        Continuar explorando
      </Link>
    </aside>
  )
}
