// MSW handlers iniciais — health check.
// Handlers de negócio serão adicionados a partir da Etapa 01.

import { http } from 'msw'
import { HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
]
