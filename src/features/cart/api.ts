import {
  CartSchema,
  QuoteSchema,
  type Cart,
  type CartItemInput,
  type Quote,
} from '@/shared/contracts'
import { http } from '@/shared/api/http'

export async function fetchCartRequest(signal?: AbortSignal): Promise<Cart> {
  const response = await http.get<unknown>('/cart', signal ? { signal } : {})
  return CartSchema.parse(response.data)
}

export async function addCartItemRequest(input: CartItemInput): Promise<Cart> {
  const response = await http.post<unknown>('/cart/items', input)
  return CartSchema.parse(response.data)
}

/** Define a quantidade absoluta da linha (idempotente: reenviar o mesmo valor não muda nada). */
export async function updateCartItemRequest(itemId: string, quantity: number): Promise<Cart> {
  const response = await http.patch<unknown>(`/cart/items/${encodeURIComponent(itemId)}`, { quantity })
  return CartSchema.parse(response.data)
}

export async function removeCartItemRequest(itemId: string): Promise<Cart> {
  const response = await http.delete<unknown>(`/cart/items/${encodeURIComponent(itemId)}`)
  return CartSchema.parse(response.data)
}

/** Cotação do servidor: todos os totais exibidos vêm daqui (nada é somado no cliente). */
export async function requestQuote(items: CartItemInput[], coupon?: string | null): Promise<Quote> {
  const response = await http.post<unknown>('/quote', { items, ...(coupon ? { coupon } : {}) })
  return QuoteSchema.parse(response.data)
}
