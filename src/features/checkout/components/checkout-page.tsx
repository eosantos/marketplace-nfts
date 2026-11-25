import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useSession } from '@/features/auth/hooks'
import { requestQuote } from '@/features/cart/api'
import { getCoupon, setCoupon } from '@/features/cart/coupon-store'
import { useCartLines, useQuote } from '@/features/cart/hooks'
import { useProfile } from '@/features/profile/hooks'
import { useWallets } from '@/features/wallets/hooks'
import { parseApiError } from '@/shared/api/errors'
import { qk } from '@/shared/api/query-keys'
import type { NftNetwork, OrderCreateInput, Order, Quote } from '@/shared/contracts'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { createOrderRequest } from '../api'
import {
  loadCheckoutState,
  newIdempotencyKey,
  saveAttempt,
  saveDraft,
  type CheckoutDraft,
} from '../checkout-store'
import { checkoutFormSchema, type CheckoutFormValues } from '../form-schema'
import { diffQuotes, type QuoteChange } from '../quote-diff'
import { submitOrder } from '../submit'
import { CollectorFields } from './collector-fields'
import { OrderStatusView } from './order-status'
import { OrderSummary } from './order-summary'
import {
  BlockedPanel,
  ChangesPanel,
  RecoveringOrder,
  UnreachableOrder,
} from './order-states'
import { ReviewPanel } from './review-panel'
import { WalletPicker } from './wallet-picker'

type Phase =
  | { name: 'editing' }
  | { name: 'validating' }
  | { name: 'changes'; fresh: Quote; changes: QuoteChange[]; title?: string }
  | { name: 'blocked'; message: string; couponProblem: boolean }
  | { name: 'submitting' }
  | { name: 'recovering' }
  | { name: 'unreachable' }
  | { name: 'tracking'; orderId: string }

const EMPTY_VALUES: CheckoutFormValues = {
  displayName: '',
  userName: '',
  profileName: '',
  email: '',
  referralCode: '',
  note: '',
  walletId: '',
  network: 'Ethereum',
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function draftToValues(draft: CheckoutDraft | undefined): CheckoutFormValues {
  if (!draft) return EMPTY_VALUES
  return { ...draft, walletId: draft.walletId ?? '', network: draft.network ?? 'Ethereum' }
}

function CheckoutFlow({ userId }: { userId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const initial = useMemo(() => loadCheckoutState(userId), [userId])

  const cart = useCartLines()
  const profile = useProfile()
  const wallets = useWallets()
  const [coupon, setCouponState] = useState<string | null>(() => getCoupon(userId))
  const quote = useQuote(cart.lines, coupon)

  // Tentativa em andamento (refresh no meio da compra) retoma sozinha; sem tentativa, edita.
  const [phase, setPhase] = useState<Phase>(() => {
    const attempt = initial.attempt
    if (!attempt) return { name: 'editing' }
    return attempt.orderId ? { name: 'tracking', orderId: attempt.orderId } : { name: 'recovering' }
  })
  const [step, setStep] = useState<'form' | 'review'>('form')
  const [reviewed, setReviewed] = useState<Quote | null>(null)
  const busy = useRef(false)
  const recovered = useRef(false)

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: draftToValues(initial.draft),
  })
  const values = form.watch()
  const selectedWallet = wallets.data?.find((wallet) => wallet.id === values.walletId)

  // Pré-preenche com o perfil (uma vez, e só se não houver rascunho de uma visita anterior).
  const prefilled = useRef(Boolean(initial.draft))
  useEffect(() => {
    if (prefilled.current || !profile.data) return
    prefilled.current = true
    form.reset({
      ...form.getValues(),
      displayName: profile.data.displayName,
      userName: profile.data.userName,
      profileName: profile.data.profileName,
      email: profile.data.email,
    })
  }, [profile.data, form])

  // Carteira padrão: a principal.
  useEffect(() => {
    const list = wallets.data
    if (!list || list.length === 0) return
    const current = form.getValues('walletId')
    if (current && list.some((wallet) => wallet.id === current)) return
    const pick = list.find((wallet) => wallet.isPrimary) ?? list[0]
    form.setValue('walletId', pick.id)
    form.setValue('network', pick.network)
  }, [wallets.data, form])

  // Rascunho: sobrevive a refresh e à expiração de sessão (o login volta para cá).
  useEffect(() => {
    const subscription = form.watch((value) => {
      const timer = setTimeout(() => {
        saveDraft(userId, {
          displayName: value.displayName ?? '',
          userName: value.userName ?? '',
          profileName: value.profileName ?? '',
          email: value.email ?? '',
          note: value.note ?? '',
          referralCode: value.referralCode ?? '',
          walletId: value.walletId ? value.walletId : null,
          network: value.network ?? null,
          step: 'form',
        })
      }, 300)
      return () => {
        clearTimeout(timer)
      }
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [form, userId])

  const items = useMemo(
    () => cart.lines.map(({ nftId, editionType, quantity }) => ({ nftId, editionType, quantity })),
    [cart.lines],
  )

  // Cotação ao vivo (atualizada por eventos): se mudou desde a revisão, a confirmação fica bloqueada.
  const liveChanges = useMemo(
    () => (step === 'review' && reviewed && quote.data ? diffQuotes(reviewed, quote.data) : []),
    [step, reviewed, quote.data],
  )

  const quoteError = quote.isError ? parseApiError(quote.error) : null

  // ---- fluxo de envio ----

  function onPlaced(order: Order) {
    queryClient.setQueryData(qk.order(userId, order.id), order)
    const attempt = loadCheckoutState(userId).attempt
    if (attempt) saveAttempt(userId, { ...attempt, orderId: order.id })
    setPhase({ name: 'tracking', orderId: order.id })
  }

  async function refreshAfterRejection(message: string) {
    try {
      const fresh = await requestQuote(items, coupon)
      const changes = reviewed ? diffQuotes(reviewed, fresh) : []
      setPhase({
        name: 'changes',
        fresh,
        changes: changes.length > 0 ? changes : [{ kind: 'total', message }],
        title: 'Precisamos que você confirme de novo',
      })
    } catch (error) {
      handleQuoteError(error)
    }
  }

  async function runSubmit(request: OrderCreateInput, key: string) {
    const outcome = await submitOrder({ post: createOrderRequest, sleep }, request, key)

    if (outcome.kind === 'placed') {
      onPlaced(outcome.order)
      return
    }
    if (outcome.kind === 'unreachable') {
      setPhase({ name: 'unreachable' })
      return
    }

    // Rejeitado pelo servidor: nada foi criado.
    saveAttempt(userId, null)
    const { error } = outcome
    if (error.code === 'PRICE_CHANGED' || error.code === 'AVAILABILITY_CONFLICT') {
      await refreshAfterRejection(error.message)
    } else if (error.code === 'FORBIDDEN') {
      setStep('form')
      setPhase({ name: 'editing' })
      form.setError('walletId', { message: error.message })
    } else {
      toast.error(error.message)
      setPhase({ name: 'editing' })
    }
  }

  async function place(quoteToUse: Quote) {
    const data = form.getValues()
    const request: OrderCreateInput = {
      collector: {
        displayName: data.displayName,
        userName: data.userName,
        profileName: data.profileName,
        email: data.email,
      },
      walletId: data.walletId,
      network: data.network,
      quoteId: quoteToUse.quoteId,
      quoteVersion: quoteToUse.version,
      ...(data.note ? { note: data.note } : {}),
      ...(data.referralCode ? { referralCode: data.referralCode } : {}),
    }
    // Uma chave por tentativa de compra, guardada junto com o corpo: reenvios usam os dois iguais.
    const key = newIdempotencyKey()
    saveAttempt(userId, { key, request, createdAt: Date.now() })
    setPhase({ name: 'submitting' })
    await runSubmit(request, key)
  }

  function handleQuoteError(error: unknown) {
    const apiError = parseApiError(error)
    if (apiError.code === 'COUPON_INVALID' || apiError.code === 'COUPON_EXPIRED') {
      setPhase({ name: 'blocked', message: apiError.message, couponProblem: true })
    } else if (apiError.code === 'AVAILABILITY_CONFLICT' || apiError.code === 'NOT_FOUND') {
      setPhase({ name: 'blocked', message: apiError.message, couponProblem: false })
    } else {
      toast.error(apiError.message)
      setPhase({ name: 'editing' })
    }
  }

  const goReview = form.handleSubmit(() => {
    if (!selectedWallet?.connected) {
      form.setError('walletId', { message: 'Conecte a carteira para continuar.' })
      return
    }
    if (!quote.data) return
    setReviewed(quote.data)
    setStep('review')
  })

  /** Confirmar: revalida preço, estoque, cupom e taxas no servidor ANTES de criar o pedido. */
  async function confirm() {
    if (busy.current || !reviewed) return
    busy.current = true
    try {
      setPhase({ name: 'validating' })
      const fresh = await requestQuote(items, coupon)
      const changes = diffQuotes(reviewed, fresh)
      if (changes.length > 0) {
        setPhase({ name: 'changes', fresh, changes })
        return
      }
      await place(reviewed)
    } catch (error) {
      handleQuoteError(error)
    } finally {
      busy.current = false
    }
  }

  /** O usuário viu as mudanças e aceitou: é a nova confirmação exigida. */
  async function acceptChanges(fresh: Quote) {
    if (busy.current) return
    busy.current = true
    try {
      setReviewed(fresh)
      await place(fresh)
    } finally {
      busy.current = false
    }
  }

  async function retryUnreachable() {
    const attempt = loadCheckoutState(userId).attempt
    if (!attempt || busy.current) {
      setPhase({ name: 'editing' })
      return
    }
    busy.current = true
    try {
      setPhase({ name: 'recovering' })
      await runSubmit(attempt.request, attempt.key) // mesma chave e mesmo corpo
    } finally {
      busy.current = false
    }
  }

  // Retomada depois de refresh/timeout: reenvia a MESMA requisição; o servidor devolve o mesmo pedido.
  useEffect(() => {
    const attempt = initial.attempt
    if (recovered.current || !attempt || attempt.orderId) return
    recovered.current = true
    busy.current = true
    void runSubmit(attempt.request, attempt.key).finally(() => {
      busy.current = false
    })
    // Executa uma única vez na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function removeCouponAndContinue() {
    setCoupon(userId, null)
    setCouponState(null)
    setPhase({ name: 'editing' })
  }

  // ---- renderização ----

  const summaryQuote =
    phase.name === 'changes'
      ? phase.fresh
      : liveChanges.length > 0
        ? quote.data
        : step === 'review' && reviewed
          ? reviewed
          : quote.data

  const working = phase.name === 'validating' || phase.name === 'submitting'
  const ctaLabel =
    phase.name === 'validating'
      ? 'Validando valores...'
      : phase.name === 'submitting'
        ? 'Enviando pedido...'
        : step === 'form'
          ? 'Revisar pedido'
          : 'Confirmar compra'

  const statusText =
    phase.name === 'validating'
      ? 'Validando preço, disponibilidade, cupom e taxas.'
      : phase.name === 'submitting'
        ? 'Enviando seu pedido.'
        : ''

  const emptyCart = !cart.isLoading && cart.lines.length === 0 && phase.name === 'editing'

  const ctaDisabled =
    working ||
    emptyCart ||
    !quote.data ||
    Boolean(quoteError) ||
    phase.name !== 'editing' ||
    (step === 'review' && (quote.isFetching || liveChanges.length > 0 || !reviewed))

  return (
    <>
      <div className="relative mb-4 flex items-center justify-center py-3 md:hidden">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => {
            router.history.back()
          }}
          className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <h1 className="text-lg font-bold">Pagamento com carteira</h1>
      </div>

      <nav aria-label="Trilha" className="hidden py-6 text-xs font-bold md:block">
        <Link to="/" className="hover:text-accent">
          Início
        </Link>{' '}
        / <span aria-hidden="true">Mercado</span> / <span aria-current="page">Pagamento</span>
      </nav>
      <h1 className="sr-only hidden md:block">Pagamento</h1>

      <p role="status" className="sr-only">
        {statusText}
      </p>

      {phase.name === 'tracking' ? (
        <OrderStatusView
          userId={userId}
          orderId={phase.orderId}
          mode="checkout"
          onRetry={() => {
            saveAttempt(userId, null)
            setPhase({ name: 'editing' })
          }}
        />
      ) : phase.name === 'recovering' ? (
        <RecoveringOrder />
      ) : phase.name === 'unreachable' ? (
        <UnreachableOrder
          busy={busy.current}
          onRetry={() => {
            void retryUnreachable()
          }}
        />
      ) : emptyCart ? (
        <div className="grid justify-items-center gap-4 bg-surface px-6 py-20 text-center">
          <h2 className="text-xl font-bold">Seu carrinho está vazio</h2>
          <p className="max-w-sm text-sm text-muted-foreground">Adicione NFTs ao carrinho para finalizar uma compra.</p>
          <Button asChild>
            <Link to="/">Explorar NFTs</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,1fr)_332px] md:gap-12">
          <div className="grid min-w-0 grid-cols-1 gap-6">
            {phase.name === 'changes' ? (
              <ChangesPanel
                changes={phase.changes}
                accepting={working}
                {...(phase.title ? { title: phase.title } : {})}
                onAccept={() => {
                  void acceptChanges(phase.fresh)
                }}
              />
            ) : null}

            {phase.name === 'blocked' ? (
              <BlockedPanel
                message={phase.message}
                {...(phase.couponProblem
                  ? { action: { label: 'Remover cupom e continuar', onClick: removeCouponAndContinue } }
                  : {})}
              />
            ) : null}

            {quoteError && phase.name === 'editing' ? (
              <BlockedPanel
                message={quoteError.message}
                {...(quoteError.code === 'COUPON_INVALID' || quoteError.code === 'COUPON_EXPIRED'
                  ? { action: { label: 'Remover cupom e continuar', onClick: removeCouponAndContinue } }
                  : {})}
              />
            ) : null}

            {liveChanges.length > 0 && phase.name === 'editing' ? (
              <ChangesPanel
                changes={liveChanges}
                accepting={false}
                title="Os valores mudaram enquanto você revisava"
                onAccept={() => {
                  if (quote.data) setReviewed(quote.data)
                }}
              />
            ) : null}

            {step === 'form' ? (
              <form
                id="checkout-form"
                noValidate
                onSubmit={(event) => {
                  void goReview(event)
                }}
                className="grid grid-cols-1 gap-8"
              >
                <CollectorFields register={form.register} errors={form.formState.errors} />
                <WalletPicker
                  wallets={wallets.data}
                  loading={wallets.isPending}
                  selectedId={values.walletId}
                  network={values.network}
                  error={form.formState.errors.walletId?.message}
                  onSelect={(walletId, network: NftNetwork) => {
                    form.setValue('walletId', walletId, { shouldValidate: form.formState.isSubmitted })
                    form.setValue('network', network)
                    form.clearErrors('walletId')
                  }}
                  onNetworkChange={(network) => {
                    form.setValue('network', network)
                  }}
                />
              </form>
            ) : (
              <ReviewPanel
                values={values}
                wallet={selectedWallet}
                onEdit={() => {
                  setStep('form')
                  setReviewed(null)
                }}
              />
            )}
          </div>

          <aside aria-label="Resumo do pedido" className="grid min-w-0 grid-cols-1 gap-5 md:sticky md:top-6">
            <OrderSummary
              quote={summaryQuote}
              loading={quote.isLoading || cart.isLoading}
              refreshing={quote.isFetching && Boolean(summaryQuote)}
              coupon={coupon}
            />

            {step === 'form' ? (
              <Button
                type="submit"
                form="checkout-form"
                size="lg"
                disabled={ctaDisabled}
                className="w-full rounded-none font-bold max-md:h-12 max-md:rounded-xl max-md:bg-gradient-to-r max-md:from-accent max-md:to-[#a8703f]"
              >
                {ctaLabel}
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                disabled={ctaDisabled}
                onClick={() => {
                  void confirm()
                }}
                className="w-full rounded-none font-bold max-md:h-12 max-md:rounded-xl max-md:bg-gradient-to-r max-md:from-accent max-md:to-[#a8703f]"
              >
                {ctaLabel}
              </Button>
            )}
          </aside>
        </div>
      )}
    </>
  )
}

/** Espera a sessão carregar (a rota já exige login) e entrega o usuário ao fluxo. */
export function CheckoutPage() {
  const { user } = useSession()

  if (!user) {
    return (
      <div role="status" aria-label="Carregando checkout" className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_332px]">
        <Skeleton className="h-[480px] w-full" />
        <Skeleton className="h-[360px] w-full" />
      </div>
    )
  }

  return <CheckoutFlow key={user.id} userId={user.id} />
}
