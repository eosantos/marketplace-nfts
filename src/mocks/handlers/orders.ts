import { delay, http, HttpResponse } from 'msw'
import { errorResponse, jsonResponse, respond } from '../http/respond'
import {
  createOrder,
  getOrder,
  ORDER_TIMEOUT_SIMULATION_MS,
  scheduleOrderSettlement,
} from '../services/orders'
import { notFound, pathParam, privateRoute, readJson } from './helpers'

export const orderHandlers = [
  http.post(
    '/api/orders',
    privateRoute(async ({ request, auth }) => {
      const body = await readJson(request)
      const result = createOrder(auth.user.id, request.headers.get('Idempotency-Key'), body)
      if (!result.ok) return errorResponse(result.error)

      const { order, created, dropResponse } = result.data
      if (created) scheduleOrderSettlement(order.id)

      if (dropResponse) {
        // O pedido já existe, mas o cliente nunca recebe a resposta (timeout simulado).
        await delay(ORDER_TIMEOUT_SIMULATION_MS)
        return HttpResponse.error()
      }
      return jsonResponse(order, created ? 201 : 200)
    }),
  ),
  http.get(
    '/api/orders/:id',
    privateRoute(({ params, auth }) => {
      const id = pathParam(params, 'id')
      return id ? respond(getOrder(auth.user.id, id)) : notFound('Pedido não encontrado.')
    }),
  ),
]
