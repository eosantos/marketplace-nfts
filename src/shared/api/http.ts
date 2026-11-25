import axios, { isAxiosError } from 'axios'
import { ApiErrorSchema, type ApiError } from '@/shared/contracts'

// Único cliente HTTP da aplicação. Sem lógica de negócio e sem dados fictícios:
// em desenvolvimento e na demonstração o MSW intercepta as chamadas a /api/*.
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

interface HttpHooks {
  getToken: () => string | null
  /** Chamado em respostas 401 com corpo ApiError (a feature de auth decide o que fazer). */
  onAuthError: (error: ApiError, url: string | undefined) => void
}

let hooks: HttpHooks | null = null

/** A feature de auth injeta o token e o tratamento de 401 (shared não depende de features). */
export function configureHttp(next: HttpHooks): void {
  hooks = next
}

http.interceptors.request.use((config) => {
  const token = hooks?.getToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

http.interceptors.response.use(undefined, (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 401) {
    const parsed = ApiErrorSchema.safeParse(error.response.data)
    if (parsed.success) hooks?.onAuthError(parsed.data, error.config?.url)
  }
  return Promise.reject(error instanceof Error ? error : new Error(String(error)))
})
