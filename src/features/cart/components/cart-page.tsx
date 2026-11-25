import { useEffect, useMemo, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, X } from 'lucide-react'
import { useSession } from '@/features/auth/hooks'
import { parseApiError } from '@/shared/api/errors'
import { qk } from '@/shared/api/query-keys'
import type { QuoteItem } from '@/shared/contracts'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { requestQuote } from '../api'
import { useCartAlerts } from '../alerts'
import { getCoupon, setCoupon } from '../coupon-store'
import { quoteSignature, useCartLines, useQuote } from '../hooks'
import { AlsoViewed } from './also-viewed'
import { CartRow } from './cart-row'
import { CartSummary } from './cart-summary'

function EmptyCart() {
  return (
    <div className="grid justify-items-center gap-4 bg-surface px-6 py-20 text-center">
      <h2 className="text-xl font-bold">Seu carrinho está vazio</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Explore o catálogo e adicione NFTs para continuar.
      </p>
      <Button asChild>
        <Link to="/">Explorar NFTs</Link>
      </Button>
    </div>
  )
}

function AlertsBanner() {
  const { alerts, dismiss } = useCartAlerts()
  if (alerts.length === 0) return null

  return (
    <ul className="mb-4 grid gap-2">
      {alerts.map((alert) => (
        <li key={alert.id} role="status" className="flex items-start justify-between gap-4 border border-accent bg-surface px-4 py-3 text-sm">
          <span>{alert.message}</span>
          <button
            type="button"
            aria-label="Dispensar aviso"
            onClick={() => {
              dismiss(alert.id)
            }}
            className="text-accent"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  )
}

/** Carrinho: linhas editáveis, resumo da cotação e cupom. Funciona para conta (API) e visitante (local). */
export function CartPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const cart = useCartLines()
  const [coupon, setCouponState] = useState<string | null>(null)

  // O cupom é por usuário (sessionStorage) e também é lido pelo checkout.
  useEffect(() => {
    setCouponState(user ? getCoupon(user.id) : null)
  }, [user])

  const quote = useQuote(cart.lines, user ? coupon : null)

  const quoteItems = useMemo(() => {
    const map = new Map<string, QuoteItem>()
    for (const item of quote.data?.items ?? []) map.set(`${item.nftId}|${item.editionType}`, item)
    return map
  }, [quote.data])

  const items = cart.lines.map(({ nftId, editionType, quantity }) => ({ nftId, editionType, quantity }))

  /** Valida o cupom com uma cotação real; só guarda se o servidor aceitar. Devolve a mensagem de erro, se houver. */
  const applyCoupon = async (code: string): Promise<string | null> => {
    if (!user) return 'Entre na sua conta para aplicar um cupom.'
    try {
      const result = await requestQuote(items, code)
      setCoupon(user.id, code)
      setCouponState(code)
      queryClient.setQueryData(qk.quote(user.id, quoteSignature(items, code)), result)
      return null
    } catch (error) {
      const apiError = parseApiError(error)
      return apiError.fieldErrors?.find((field) => field.field === 'coupon')?.message ?? apiError.message
    }
  }

  const removeCoupon = () => {
    if (user) setCoupon(user.id, null)
    setCouponState(null)
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-center py-3 md:hidden">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => {
            router.history.back()
          }}
          className="absolute left-5 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <h1 className="text-lg font-bold">Carrinho de NFTs</h1>
      </div>

      <nav aria-label="Trilha" className="hidden py-6 text-xs font-bold md:block">
        <Link to="/" className="hover:text-accent">
          Início
        </Link>{' '}
        / <span aria-hidden="true">Mercado</span> / <span aria-current="page">Carrinho</span>
      </nav>
      <h1 className="sr-only hidden md:block">Carrinho de NFTs</h1>

      <AlertsBanner />

      {cart.isLoading ? (
        <div role="status" aria-label="Carregando carrinho" className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_332px] md:gap-12">
          <div className="grid gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-[94px] w-full" />
            ))}
          </div>
          <Skeleton className="h-[360px] w-full" />
        </div>
      ) : cart.isError ? (
        <div role="alert" className="grid justify-items-center gap-4 bg-surface px-6 py-16 text-center">
          <p className="font-bold">Não foi possível carregar o carrinho.</p>
          <Button onClick={cart.refetch}>Tentar novamente</Button>
        </div>
      ) : cart.lines.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_332px] md:gap-12">
          <section aria-label="Itens do carrinho">
            <div className="hidden grid-cols-[1fr_110px_120px_110px_36px] gap-x-4 border-b border-border px-3 pb-3 text-sm font-bold md:grid">
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
              <span />
            </div>
            <ul className="mt-3 grid gap-3">
              {cart.lines.map((line) => (
                <CartRow
                  key={line.key}
                  line={line}
                  quoteItem={quoteItems.get(`${line.nftId}|${line.editionType}`)}
                  quoteLoading={quote.isLoading}
                />
              ))}
            </ul>
          </section>

          <CartSummary
            quote={quote}
            isGuest={cart.isGuest}
            appliedCoupon={user ? coupon : null}
            onApplyCoupon={applyCoupon}
            onRemoveCoupon={removeCoupon}
          />
        </div>
      )}

      <AlsoViewed excludeIds={new Set(cart.lines.map((line) => line.nftId))} />
    </>
  )
}
