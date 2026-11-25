import {
  AssetPathSchema,
  PasswordChangeInputSchema,
  ProfileUpdateInputSchema,
  type OkResponse,
  type Profile,
} from '@/shared/contracts'
import { hashPassword, PASSWORD_HASH_ITERATIONS, verifyPassword } from '../auth/password'
import { getDb, mutateDb } from '../db'
import type { MockDb, MockUserRecord } from '../db/types'
import { fail, ok, validationFail, type ServiceResult } from '../http/result'
import { randomHex } from '../util/random'

const OK_BODY: OkResponse = { ok: true }

export const AVATAR_MAX_BYTES = 300 * 1024
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export function toProfile(record: MockUserRecord): Profile {
  return {
    userId: record.id,
    displayName: record.displayName,
    userName: record.userName,
    profileName: record.profileName,
    email: record.email,
    ...(record.avatar ? { avatar: record.avatar } : {}),
  }
}

function findUser(db: MockDb, userId: string): MockUserRecord | undefined {
  return db.users.find((user) => user.id === userId)
}

export function getProfile(userId: string): ServiceResult<Profile> {
  const record = findUser(getDb(), userId)
  return record ? ok(toProfile(record)) : fail('NOT_FOUND', 'Perfil não encontrado.')
}

export function updateProfile(userId: string, input: unknown): ServiceResult<Profile> {
  const parsed = ProfileUpdateInputSchema.safeParse(input)
  if (!parsed.success) return validationFail(parsed.error)

  const data = parsed.data

  return mutateDb((db): ServiceResult<Profile> => {
    const record = findUser(db, userId)
    if (!record) return fail('NOT_FOUND', 'Perfil não encontrado.')

    if (
      data.userName !== undefined &&
      db.users.some(
        (user) => user.id !== userId && user.userName.toLowerCase() === data.userName?.toLowerCase(),
      )
    ) {
      return fail('VALIDATION_ERROR', 'Verifique os campos informados.', [
        { field: 'userName', message: 'Nome de usuário indisponível.' },
      ])
    }

    if (data.displayName !== undefined) record.displayName = data.displayName
    if (data.userName !== undefined) record.userName = data.userName
    if (data.profileName !== undefined) record.profileName = data.profileName
    if (data.avatar === null) {
      delete record.avatar
    } else if (data.avatar !== undefined) {
      record.avatar = data.avatar
    }

    return ok(toProfile(record))
  })
}

/** Avatar enviado como arquivo: validado (tipo e tamanho) e guardado como data URL. */
export async function uploadAvatar(userId: string, file: File): Promise<ServiceResult<Profile>> {
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
    return fail('VALIDATION_ERROR', 'Verifique os campos informados.', [
      { field: 'avatar', message: 'Use uma imagem PNG, JPEG ou WebP.' },
    ])
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return fail('VALIDATION_ERROR', 'Verifique os campos informados.', [
      { field: 'avatar', message: 'A imagem deve ter no máximo 300 KB.' },
    ])
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)

  const parsedAvatar = AssetPathSchema.safeParse(`data:${file.type};base64,${btoa(binary)}`)
  if (!parsedAvatar.success) return validationFail(parsedAvatar.error)

  return updateProfile(userId, { avatar: parsedAvatar.data })
}

/** Confere a senha atual contra o hash do mock e troca por um novo hash com novo salt. */
export async function changePassword(
  userId: string,
  currentSessionId: string,
  input: unknown,
): Promise<ServiceResult<OkResponse>> {
  const parsed = PasswordChangeInputSchema.safeParse(input)
  if (!parsed.success) return validationFail(parsed.error)

  const { currentPassword, newPassword } = parsed.data
  const record = findUser(getDb(), userId)
  if (!record) return fail('NOT_FOUND', 'Perfil não encontrado.')

  if (!(await verifyPassword(currentPassword, record))) {
    return fail('VALIDATION_ERROR', 'Verifique os campos informados.', [
      { field: 'currentPassword', message: 'Senha atual incorreta.' },
    ])
  }
  if (newPassword === currentPassword) {
    return fail('VALIDATION_ERROR', 'Verifique os campos informados.', [
      { field: 'newPassword', message: 'A nova senha deve ser diferente da atual.' },
    ])
  }

  const passwordSalt = randomHex(16)
  const passwordHash = await hashPassword(newPassword, passwordSalt)

  return mutateDb((db): ServiceResult<OkResponse> => {
    const target = findUser(db, userId)
    if (!target) return fail('NOT_FOUND', 'Perfil não encontrado.')

    target.passwordHash = passwordHash
    target.passwordSalt = passwordSalt
    target.passwordIterations = PASSWORD_HASH_ITERATIONS
    // Encerra as outras sessões do usuário; mantém a atual.
    db.sessions = db.sessions.filter(
      (session) => session.userId !== userId || session.id === currentSessionId,
    )
    return ok(OK_BODY)
  })
}
