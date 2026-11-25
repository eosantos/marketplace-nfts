import { isAxiosError } from 'axios'
import { parseApiError } from '@/shared/api/errors'
import type { ApiError, Order, OrderCreateInput } from '@/shared/contracts'

export interface SubmitDeps {
  post: (request: OrderCreateInput, key: string) => Promise<{ order: Order; created: boolean }>
  sleep: (ms: number) => Promise<void>
}

export type SubmitOutcome =
  | { kind: 'placed'; order: Order; created: boolean; attempts: number }
  /** O servidor respondeu e recusou (4xx): nada foi criado e reenviar não adianta. */
  | { kind: 'rejected'; error: ApiError }
  /** Sem resposta (timeout/rede/5xx) em todas as tentativas: o pedido PODE ter sido criado. */
  | { kind: 'unreachable'; attempts: number }

export const DEFAULT_SUBMIT_DELAYS_MS = [800, 1600] as const

/** Falha sem resposta útil do servidor: timeout, queda de rede ou 5xx. */
export function isRetryable(error: unknown): boolean {
  if (!isAxiosError(error)) return false
  return !error.response || error.response.status >= 500
}

/**
 * Envia o pedido e, se a resposta se perder (timeout, rede, 5xx), reenvia a MESMA requisição com a
 * MESMA Idempotency-Key. O servidor reconhece a chave e devolve o pedido que já criou, então
 * nunca nasce uma segunda compra. Erros 4xx (preço mudou, estoque, carteira) não são reenviados.
 */
export async function submitOrder(
  deps: SubmitDeps,
  request: OrderCreateInput,
  key: string,
  delaysMs: readonly number[] = DEFAULT_SUBMIT_DELAYS_MS,
): Promise<SubmitOutcome> {
  const maxAttempts = delaysMs.length + 1

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await deps.post(request, key)
      return { kind: 'placed', ...result, attempts: attempt }
    } catch (error) {
      if (!isRetryable(error)) return { kind: 'rejected', error: parseApiError(error) }
      if (attempt === maxAttempts) return { kind: 'unreachable', attempts: attempt }
      await deps.sleep(delaysMs[attempt - 1])
    }
  }

  return { kind: 'unreachable', attempts: maxAttempts }
}
