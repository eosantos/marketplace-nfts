// Comportamento determinístico dos cenários (latência e falhas transversais).
// Cenários que dependem de pedidos/cotação (preço, estoque, pagamento) são
// tratados nos serviços da Etapa 01 (parte 2b).

import { delay, HttpResponse } from 'msw'
import { getActiveScenario } from '../db'
import { errorResponse } from '../http/respond'
import { latencyFor } from './latency'

/** auth = login/cadastro/sessão · public = catálogo · private = recursos do usuário. */
export type RouteKind = 'auth' | 'public' | 'private'

/** Aplica latência e falhas do cenário ativo. Retorna uma resposta para interromper a chamada. */
export async function applyScenario(kind: RouteKind, request: Request): Promise<Response | null> {
  await delay(latencyFor(request.url))

  const scenario = getActiveScenario()

  if (scenario === 'network-failure') {
    return HttpResponse.error()
  }
  if (scenario === 'http-4xx' && kind !== 'auth') {
    return errorResponse({ code: 'FORBIDDEN', message: 'Acesso negado (cenário http-4xx).' })
  }
  if (scenario === 'http-5xx' && kind !== 'auth') {
    return errorResponse({ code: 'TRANSIENT', message: 'Serviço indisponível (cenário http-5xx).' })
  }

  return null
}
