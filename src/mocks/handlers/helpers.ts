import type { HttpResponseResolver, PathParams } from 'msw'
import { authenticate } from '../http/auth'
import { errorResponse } from '../http/respond'
import { withScenario } from '../http/with-scenario'
import type { AuthContext } from '../services/auth'

/** Lê o corpo JSON; corpo ausente ou malformado vira `undefined` (a validação responde 422). */
export async function readJson(request: Request): Promise<unknown> {
  try {
    const body: unknown = await request.json()
    return body
  } catch {
    return undefined
  }
}

export function pathParam(params: PathParams, key: string): string | undefined {
  const value = params[key]
  return typeof value === 'string' ? value : value?.[0]
}

export function notFound(message: string): Response {
  return errorResponse({ code: 'NOT_FOUND', message })
}

export function publicRoute(resolver: HttpResponseResolver): HttpResponseResolver {
  return withScenario('public', resolver)
}

interface PrivateContext {
  request: Request
  params: PathParams
  auth: AuthContext
}

/** Rota privada: aplica cenário, exige sessão válida e entrega o usuário autenticado. */
export function privateRoute(
  resolver: (context: PrivateContext) => Response | Promise<Response>,
): HttpResponseResolver {
  return withScenario('private', (info) => {
    const auth = authenticate(info.request)
    if (!auth.ok) return errorResponse(auth.error)
    return resolver({ request: info.request, params: info.params, auth: auth.data })
  })
}
