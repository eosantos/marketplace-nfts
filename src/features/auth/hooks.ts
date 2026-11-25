import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { qk } from '@/shared/api/query-keys'
import type { LoginInput, RegisterInput } from '@/shared/contracts'
import { fetchSession, loginRequest, registerRequest } from './api'
import { completeAuth, logout } from './lifecycle'
import { useStoredSession } from './session-store'

export const sessionQueryOptions = queryOptions({
  queryKey: qk.session,
  queryFn: ({ signal }) => fetchSession(signal),
  retry: false,
  staleTime: 5 * 60_000,
})

/** Usuário autenticado: restaura a sessão (GET /session) quando há token guardado. */
export function useSession() {
  const stored = useStoredSession()
  const query = useQuery({ ...sessionQueryOptions, enabled: stored !== null })

  return {
    user: stored !== null ? (query.data?.user ?? null) : null,
    isAuthenticated: stored !== null && query.data !== undefined,
    isLoading: stored !== null && query.isPending,
  }
}

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) => loginRequest(input),
    onSuccess: (auth) => {
      completeAuth(auth)
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => registerRequest(input),
    onSuccess: (auth) => {
      completeAuth(auth)
    },
  })
}

export function useLogout() {
  return useMutation({ mutationFn: () => logout() })
}
