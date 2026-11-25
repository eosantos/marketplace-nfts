import { http } from 'msw'
import { authenticate } from '../http/auth'
import { errorResponse, respond } from '../http/respond'
import { ok } from '../http/result'
import { withScenario } from '../http/with-scenario'
import { getSessionResponse, login, logout, register } from '../services/auth'
import { readJson } from './helpers'

export const authHandlers = [
  http.post(
    '/api/auth/register',
    withScenario('auth', async ({ request }) => respond(await register(await readJson(request)), 201)),
  ),
  http.post(
    '/api/auth/login',
    withScenario('auth', async ({ request }) => respond(await login(await readJson(request)))),
  ),
  http.get(
    '/api/session',
    withScenario('auth', ({ request }) => {
      const auth = authenticate(request)
      return auth.ok ? respond(ok(getSessionResponse(auth.data))) : errorResponse(auth.error)
    }),
  ),
  http.post(
    '/api/auth/logout',
    withScenario('auth', ({ request }) => {
      const auth = authenticate(request)
      return auth.ok ? respond(logout(auth.data)) : errorResponse(auth.error)
    }),
  ),
]
