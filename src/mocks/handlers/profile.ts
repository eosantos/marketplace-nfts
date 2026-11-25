import { http } from 'msw'
import { errorResponse, respond } from '../http/respond'
import { changePassword, getProfile, updateProfile, uploadAvatar } from '../services/profile'
import { privateRoute, readJson } from './helpers'

export const profileHandlers = [
  http.get('/api/profile', privateRoute(({ auth }) => respond(getProfile(auth.user.id)))),
  http.patch(
    '/api/profile',
    privateRoute(async ({ request, auth }) =>
      respond(updateProfile(auth.user.id, await readJson(request))),
    ),
  ),
  http.post(
    '/api/profile/avatar',
    privateRoute(async ({ request, auth }) => {
      let file: unknown = null
      try {
        const form = await request.formData()
        file = form.get('avatar')
      } catch {
        file = null
      }
      if (!(file instanceof File)) {
        return errorResponse({
          code: 'VALIDATION_ERROR',
          message: 'Verifique os campos informados.',
          fieldErrors: [{ field: 'avatar', message: 'Envie uma imagem no campo "avatar".' }],
        })
      }
      return respond(await uploadAvatar(auth.user.id, file))
    }),
  ),
  http.post(
    '/api/profile/password',
    privateRoute(async ({ request, auth }) =>
      respond(await changePassword(auth.user.id, auth.session.id, await readJson(request))),
    ),
  ),
]
