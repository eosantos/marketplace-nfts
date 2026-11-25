import { http } from 'msw'
import { respond } from '../http/respond'
import { createQuote } from '../services/quote'
import { privateRoute, readJson } from './helpers'

export const quoteHandlers = [
  http.post(
    '/api/quote',
    privateRoute(async ({ request, auth }) =>
      respond(createQuote(auth.user.id, await readJson(request))),
    ),
  ),
]
