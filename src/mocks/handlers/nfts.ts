import { http } from 'msw'
import { respond } from '../http/respond'
import { getFacets, getNft, listNfts } from '../services/catalog'
import { notFound, pathParam, publicRoute } from './helpers'

export const nftHandlers = [
  // /facets precisa vir antes de /:id para não ser capturado como um id.
  http.get('/api/nfts/facets', publicRoute(() => respond(getFacets()))),
  http.get(
    '/api/nfts',
    publicRoute(({ request }) =>
      respond(listNfts(Object.fromEntries(new URL(request.url).searchParams))),
    ),
  ),
  http.get(
    '/api/nfts/:id',
    publicRoute(({ params }) => {
      const id = pathParam(params, 'id')
      return id ? respond(getNft(id)) : notFound('NFT não encontrado.')
    }),
  ),
]
