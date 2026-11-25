import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks'
import { qk } from '@/shared/api/query-keys'
import { fetchOrderRequest } from './api'

/**
 * Pedido (estado e recibo). Os eventos `order.updated` atualizam este cache; o polling lento é
 * só uma rede de segurança para quando o tempo real estiver fora do ar. Estados terminais param o polling.
 */
export function useOrder(orderId: string | undefined) {
  const { user } = useSession()

  return useQuery({
    queryKey: qk.order(user?.id ?? 'anonymous', orderId ?? ''),
    queryFn: ({ signal }) => fetchOrderRequest(orderId ?? '', signal),
    enabled: user !== null && orderId !== undefined,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 4000 : false),
  })
}
