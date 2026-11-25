import { OrderSchema, type Order, type OrderCreateInput } from '@/shared/contracts'
import { http } from '@/shared/api/http'

/** Menor que a simulação de timeout do servidor (20 s): o cliente desiste antes e recupera pela chave. */
export const ORDER_REQUEST_TIMEOUT_MS = 6000

export async function createOrderRequest(
  request: OrderCreateInput,
  idempotencyKey: string,
): Promise<{ order: Order; created: boolean }> {
  const response = await http.post<unknown>('/orders', request, {
    headers: { 'Idempotency-Key': idempotencyKey },
    timeout: ORDER_REQUEST_TIMEOUT_MS,
  })
  // 201 = criado agora; 200 = reenvio idempotente devolvendo o pedido que já existia.
  return { order: OrderSchema.parse(response.data), created: response.status === 201 }
}

export async function fetchOrderRequest(orderId: string, signal?: AbortSignal): Promise<Order> {
  const response = await http.get<unknown>(`/orders/${encodeURIComponent(orderId)}`, signal ? { signal } : {})
  return OrderSchema.parse(response.data)
}
