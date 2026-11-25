import {
  LoginInputSchema,
  RegisterInputSchema,
  type AuthResponse,
  type OkResponse,
  type Session,
  type User,
} from '@/shared/contracts'
import { hashPassword, PASSWORD_HASH_ITERATIONS, verifyPassword } from '../auth/password'
import { getActiveScenario, getDb, mutateDb } from '../db'
import { nextSequence } from '../db/sequences'
import type { MockDb, MockUserRecord } from '../db/types'
import { fail, ok, validationFail, type ServiceResult } from '../http/result'
import { randomHex } from '../util/random'

export interface AuthContext {
  user: MockUserRecord
  session: Session
}

const SESSION_TTL_MS = 2 * 60 * 60 * 1000
const OK_BODY: OkResponse = { ok: true }

/** Remove hash/salt: credenciais nunca saem do mock. */
export function toPublicUser(record: MockUserRecord): User {
  return {
    id: record.id,
    email: record.email,
    displayName: record.displayName,
    userName: record.userName,
    profileName: record.profileName,
    ...(record.avatar ? { avatar: record.avatar } : {}),
    createdAt: record.createdAt,
  }
}

function createSession(db: MockDb, userId: string): Session {
  const session: Session = {
    id: `sess_${nextSequence(db, 'session')}`,
    userId,
    token: `kurio_${randomHex(24)}`,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  }
  db.sessions.push(session)
  return session
}

function emailTaken(): ServiceResult<AuthResponse> {
  return fail('EMAIL_TAKEN', 'Este e-mail já está cadastrado.', [
    { field: 'email', message: 'Este e-mail já está cadastrado.' },
  ])
}

export async function register(input: unknown): Promise<ServiceResult<AuthResponse>> {
  const parsed = RegisterInputSchema.safeParse(input)
  if (!parsed.success) return validationFail(parsed.error)

  const data = parsed.data
  const email = data.email.trim().toLowerCase()

  if (
    getActiveScenario() === 'signup-conflict' ||
    getDb().users.some((user) => user.email.toLowerCase() === email)
  ) {
    return emailTaken()
  }

  const passwordSalt = randomHex(16)
  const passwordHash = await hashPassword(data.password, passwordSalt)

  return mutateDb((db): ServiceResult<AuthResponse> => {
    // Revalida após o await (dois envios rápidos não podem duplicar o e-mail).
    if (db.users.some((user) => user.email.toLowerCase() === email)) return emailTaken()
    if (db.users.some((user) => user.userName.toLowerCase() === data.userName.toLowerCase())) {
      return fail('VALIDATION_ERROR', 'Verifique os campos informados.', [
        { field: 'userName', message: 'Nome de usuário indisponível.' },
      ])
    }

    const now = new Date().toISOString()
    const record: MockUserRecord = {
      id: `user_${nextSequence(db, 'user')}`,
      email,
      displayName: data.displayName,
      userName: data.userName,
      profileName: data.profileName,
      createdAt: now,
      passwordHash,
      passwordSalt,
      passwordIterations: PASSWORD_HASH_ITERATIONS,
    }
    db.users.push(record)
    db.carts.push({ userId: record.id, items: [], updatedAt: now })

    return ok({ user: toPublicUser(record), session: createSession(db, record.id) })
  })
}

export async function login(input: unknown): Promise<ServiceResult<AuthResponse>> {
  const parsed = LoginInputSchema.safeParse(input)
  if (!parsed.success) return validationFail(parsed.error)

  const email = parsed.data.email.trim().toLowerCase()
  const record = getDb().users.find((user) => user.email.toLowerCase() === email)
  const valid = record ? await verifyPassword(parsed.data.password, record) : false

  if (!record || !valid) return fail('UNAUTHENTICATED', 'E-mail ou senha inválidos.')

  return mutateDb(
    (db): ServiceResult<AuthResponse> =>
      ok({ user: toPublicUser(record), session: createSession(db, record.id) }),
  )
}

export function getSessionResponse(context: AuthContext): AuthResponse {
  return { user: toPublicUser(context.user), session: context.session }
}

export function logout(context: AuthContext): ServiceResult<OkResponse> {
  mutateDb((db) => {
    db.sessions = db.sessions.filter((session) => session.id !== context.session.id)
  })
  return ok(OK_BODY)
}
