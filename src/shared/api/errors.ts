import { isAxiosError } from 'axios'
import { ApiErrorSchema, type ApiError } from '@/shared/contracts'

const NETWORK_MESSAGE = 'Não foi possível conectar. Verifique sua conexão e tente novamente.'
const GENERIC_MESSAGE = 'Algo deu errado. Tente novamente em instantes.'

/** Normaliza qualquer falha em um ApiError (corpo do contrato, rede/timeout ou genérico). */
export function parseApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const parsed = ApiErrorSchema.safeParse(error.response?.data)
    if (parsed.success) return parsed.data
    return { code: 'TRANSIENT', message: error.response ? GENERIC_MESSAGE : NETWORK_MESSAGE }
  }
  return { code: 'TRANSIENT', message: GENERIC_MESSAGE }
}
