import { http } from 'msw'
import { respond } from '../http/respond'
import { addFavorite, listFavorites, removeFavorite } from '../services/favorites'
import { notFound, pathParam, privateRoute, readJson } from './helpers'

export const favoritesHandlers = [
  http.get('/api/favorites', privateRoute(({ auth }) => respond(listFavorites(auth.user.id)))),
  http.post(
    '/api/favorites',
    privateRoute(async ({ request, auth }) =>
      respond(addFavorite(auth.user.id, await readJson(request)), 201),
    ),
  ),
  http.delete(
    '/api/favorites/:nftId',
    privateRoute(({ params, auth }) => {
      const nftId = pathParam(params, 'nftId')
      return nftId ? respond(removeFavorite(auth.user.id, nftId)) : notFound('NFT não encontrado.')
    }),
  ),
]
