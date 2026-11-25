import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks'

// Avisos do carrinho ("o preço/a disponibilidade mudou"). A Etapa 06 alimenta esta lista a partir
// dos eventos do Socket.IO com `pushCartAlert`; a UI só lê o cache.
export interface CartAlert {
  id: string
  message: string
}

const alertsKey = (userId: string) => ['cart-alerts', userId] as const

export function pushCartAlert(queryClient: QueryClient, userId: string, alert: CartAlert): void {
  queryClient.setQueryData<CartAlert[]>(alertsKey(userId), (old) => {
    const list = old ?? []
    return list.some((item) => item.id === alert.id) ? list : [...list, alert]
  })
}

export function dismissCartAlert(queryClient: QueryClient, userId: string, id: string): void {
  queryClient.setQueryData<CartAlert[]>(alertsKey(userId), (old) => (old ?? []).filter((item) => item.id !== id))
}

export function clearCartAlerts(queryClient: QueryClient, userId: string): void {
  queryClient.setQueryData<CartAlert[]>(alertsKey(userId), [])
}

export function useCartAlerts() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? 'anonymous'

  const { data } = useQuery<CartAlert[]>({
    queryKey: alertsKey(userId),
    queryFn: () => Promise.resolve([]),
    initialData: [],
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return { alerts: data, dismiss: (id: string) => { dismissCartAlert(queryClient, userId, id) } }
}
