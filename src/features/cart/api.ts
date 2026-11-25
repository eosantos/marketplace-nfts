import { CartSchema, type Cart, type CartItemInput } from '@/shared/contracts'
import { http } from '@/shared/api/http'

export async function addCartItemRequest(input: CartItemInput): Promise<Cart> {
  const response = await http.post<unknown>('/cart/items', input)
  return CartSchema.parse(response.data)
}
