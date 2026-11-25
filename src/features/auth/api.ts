import {
  AuthResponseSchema,
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
} from '@/shared/contracts'
import { http } from '@/shared/api/http'

export async function loginRequest(input: LoginInput): Promise<AuthResponse> {
  const response = await http.post<unknown>('/auth/login', input)
  return AuthResponseSchema.parse(response.data)
}

export async function registerRequest(input: RegisterInput): Promise<AuthResponse> {
  const response = await http.post<unknown>('/auth/register', input)
  return AuthResponseSchema.parse(response.data)
}

export async function fetchSession(signal?: AbortSignal): Promise<AuthResponse> {
  const response = await http.get<unknown>('/session', signal ? { signal } : {})
  return AuthResponseSchema.parse(response.data)
}
