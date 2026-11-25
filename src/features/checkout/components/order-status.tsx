import { useEffect } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { parseApiError } from '@/shared/api/errors'
import { qk } from '@/shared/api/query-keys'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { clearCheckoutState, saveAttempt } from '../checkout-store'
import { useOrder } from '../hooks'
import { PendingOrder, RefusedOrder } from './order-states'
import { Receipt } from './receipt'

interface OrderStatusViewProps {
  userId: string
  orderId: string
  /** `checkout`: ao confirmar, vai para o recibo. `page`: é o próprio recibo (/order/$orderId). */
  mode: 'checkout' | 'page'
  onRetry: () => void
}

/**
 * Estado do pedido a partir do REST (com os eventos `order.updated` atualizando o mesmo cache):
 * pendente, recusado ou confirmado. A confirmação só aparece para pedido efetivamente confirmado.
 */
export function OrderStatusView({ userId, orderId, mode, onRetry }: OrderStatusViewProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const order = useOrder(orderId)
  const status = order.data?.status

  useEffect(() => {
    if (status === 'confirmed') {
      clearCheckoutState(userId)
      // O servidor tirou do carrinho só o que foi comprado e baixou o estoque: relê os dois.
      void queryClient.invalidateQueries({ queryKey: qk.cart(userId) })
      void queryClient.invalidateQueries({ queryKey: ['nfts'] })
      if (mode === 'checkout') router.history.replace(`/order/${encodeURIComponent(orderId)}`)
    } else if (status === 'refused') {
      saveAttempt(userId, null)
    }
  }, [status, userId, orderId, mode, queryClient, router])

  if (order.isPending) {
    return (
      <div role="status" aria-label="Carregando pedido" className="grid gap-3">
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[220px] w-full" />
      </div>
    )
  }

  if (!order.data) {
    const code = parseApiError(order.error).code
    return (
      <div role="alert" className="grid justify-items-center gap-4 bg-surface px-6 py-16 text-center">
        <h2 className="text-xl font-bold">
          {code === 'NOT_FOUND' ? 'Pedido não encontrado' : code === 'FORBIDDEN' ? 'Você não tem acesso a este pedido' : 'Não foi possível carregar o pedido'}
        </h2>
        {code === 'NOT_FOUND' || code === 'FORBIDDEN' ? (
          <Button asChild>
            <Link to="/">Voltar ao catálogo</Link>
          </Button>
        ) : (
          <Button
            onClick={() => {
              void order.refetch()
            }}
          >
            Tentar novamente
          </Button>
        )}
      </div>
    )
  }

  if (order.data.status === 'refused') return <RefusedOrder order={order.data} onRetry={onRetry} />
  if (order.data.status === 'confirmed') {
    return mode === 'page' ? <Receipt order={order.data} /> : <PendingOrder orderId={orderId} />
  }
  return <PendingOrder orderId={orderId} />
}
