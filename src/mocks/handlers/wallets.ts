import { http } from 'msw'
import { respond } from '../http/respond'
import {
  createWallet,
  listWallets,
  setWalletConnection,
  updateWallet,
} from '../services/wallets'
import { notFound, pathParam, privateRoute, readJson } from './helpers'

export const walletHandlers = [
  http.get('/api/wallets', privateRoute(({ auth }) => respond(listWallets(auth.user.id)))),
  http.post(
    '/api/wallets',
    privateRoute(async ({ request, auth }) =>
      respond(createWallet(auth.user.id, await readJson(request)), 201),
    ),
  ),
  http.patch(
    '/api/wallets/:id',
    privateRoute(async ({ request, params, auth }) => {
      const id = pathParam(params, 'id')
      if (!id) return notFound('Carteira não encontrada.')
      return respond(updateWallet(auth.user.id, id, await readJson(request)))
    }),
  ),
  http.post(
    '/api/wallets/:id/connect',
    privateRoute(({ params, auth }) => {
      const id = pathParam(params, 'id')
      return id
        ? respond(setWalletConnection(auth.user.id, id, true))
        : notFound('Carteira não encontrada.')
    }),
  ),
  http.post(
    '/api/wallets/:id/disconnect',
    privateRoute(({ params, auth }) => {
      const id = pathParam(params, 'id')
      return id
        ? respond(setWalletConnection(auth.user.id, id, false))
        : notFound('Carteira não encontrada.')
    }),
  ),
]
