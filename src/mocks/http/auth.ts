import { getActiveScenario, getDb } from '../db'
import type { AuthContext } from '../services/auth'
import { fail, ok, type ServiceResult } from './result'

export function readBearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  if (!header) return null
  const [scheme, token] = header.split(' ')
  return scheme.toLowerCase() === 'bearer' && token ? token : null
}

/** Valida o token Bearer, a expiração e o cenário `session-expired`. */
export function authenticate(request: Request): ServiceResult<AuthContext> {
  if (getActiveScenario() === 'session-expired') {
    return fail('SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
  }

  const token = readBearerToken(request)
  if (!token) return fail('UNAUTHENTICATED', 'Faça login para continuar.')

  const db = getDb()
  const session = db.sessions.find((candidate) => candidate.token === token)
  if (!session) return fail('UNAUTHENTICATED', 'Sessão inválida. Entre novamente.')
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return fail('SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
  }

  const user = db.users.find((candidate) => candidate.id === session.userId)
  if (!user) return fail('UNAUTHENTICATED', 'Usuário não encontrado.')

  return ok({ user, session })
}
