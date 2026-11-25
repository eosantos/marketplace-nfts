import { http } from '@/shared/api/http'
import {
  ProfileSchema,
  type PasswordChangeInput,
  type Profile,
  type ProfileUpdateInput,
} from '@/shared/contracts'

export async function fetchProfile(signal?: AbortSignal): Promise<Profile> {
  const response = await http.get<unknown>('/profile', signal ? { signal } : {})
  return ProfileSchema.parse(response.data)
}

export async function updateProfileRequest(input: ProfileUpdateInput): Promise<Profile> {
  const response = await http.patch<unknown>('/profile', input)
  return ProfileSchema.parse(response.data)
}

/** Upload multipart (campo `avatar`). O Content-Type com boundary é definido pelo navegador. */
export async function uploadAvatarRequest(file: File): Promise<Profile> {
  const body = new FormData()
  body.append('avatar', file)
  const response = await http.post<unknown>('/profile/avatar', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return ProfileSchema.parse(response.data)
}

export async function changePasswordRequest(input: PasswordChangeInput): Promise<void> {
  await http.post<unknown>('/profile/password', input)
}
