import { http } from 'msw'
import { respond } from '../http/respond'
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from '../services/cart'
import { notFound, pathParam, privateRoute, readJson } from './helpers'

export const cartHandlers = [
  http.get('/api/cart', privateRoute(({ auth }) => respond(getCart(auth.user.id)))),
  http.post(
    '/api/cart/items',
    privateRoute(async ({ request, auth }) =>
      respond(addCartItem(auth.user.id, await readJson(request))),
    ),
  ),
  http.patch(
    '/api/cart/items/:itemId',
    privateRoute(async ({ request, params, auth }) => {
      const itemId = pathParam(params, 'itemId')
      if (!itemId) return notFound('Item do carrinho não encontrado.')
      return respond(updateCartItem(auth.user.id, itemId, await readJson(request)))
    }),
  ),
  http.delete(
    '/api/cart/items/:itemId',
    privateRoute(({ params, auth }) => {
      const itemId = pathParam(params, 'itemId')
      return itemId
        ? respond(removeCartItem(auth.user.id, itemId))
        : notFound('Item do carrinho não encontrado.')
    }),
  ),
  http.delete('/api/cart', privateRoute(({ auth }) => respond(clearCart(auth.user.id)))),
]
