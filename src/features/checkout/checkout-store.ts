import { z } from 'zod'
import { NftNetworkSchema, OrderCreateInputSchema } from '@/shared/contracts'

// Estado do checkout em sessionStorage, por usuário: sobrevive ao refresh e à expiração de sessão
// (o login volta para /checkout e o formulário é retomado). Nunca é compartilhado entre usuários.

export const CheckoutDraftSchema = z.object({
  displayName: z.string(),
  userName: z.string(),
  profileName: z.string(),
  email: z.string(),
  note: z.string(),
  referralCode: z.string(),
  walletId: z.string().nullable(),
  network: NftNetworkSchema.nullable(),
  step: z.enum(['form', 'review']),
})

export type CheckoutDraft = z.infer<typeof CheckoutDraftSchema>

/**
 * Uma tentativa de compra: a Idempotency-Key e o corpo exato enviado. Com isso, depois de um
 * timeout ou refresh a MESMA requisição é reenviada e o servidor devolve o mesmo pedido.
 */
export const CheckoutAttemptSchema = z.object({
  key: z.string().min(8),
  request: OrderCreateInputSchema,
  orderId: z.string().optional(),
  createdAt: z.number(),
})

export type CheckoutAttempt = z.infer<typeof CheckoutAttemptSchema>

const StoredSchema = z.object({
  draft: CheckoutDraftSchema.optional(),
  attempt: CheckoutAttemptSchema.optional(),
})

type Stored = z.infer<typeof StoredSchema>

const storageKey = (userId: string) => `kurio:checkout:${userId}`

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage
  } catch {
    return null
  }
}

export function loadCheckoutState(userId: string): Stored {
  try {
    const raw = storage()?.getItem(storageKey(userId))
    if (!raw) return {}
    const parsed = StoredSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : {}
  } catch {
    return {}
  }
}

function write(userId: string, state: Stored): void {
  try {
    if (!state.draft && !state.attempt) storage()?.removeItem(storageKey(userId))
    else storage()?.setItem(storageKey(userId), JSON.stringify(state))
  } catch {
    // Sem sessionStorage: o checkout funciona, mas não retoma depois de um refresh.
  }
}

export function saveDraft(userId: string, draft: CheckoutDraft | null): void {
  const { attempt } = loadCheckoutState(userId)
  write(userId, { ...(draft ? { draft } : {}), ...(attempt ? { attempt } : {}) })
}

export function saveAttempt(userId: string, attempt: CheckoutAttempt | null): void {
  const { draft } = loadCheckoutState(userId)
  write(userId, { ...(draft ? { draft } : {}), ...(attempt ? { attempt } : {}) })
}

export function clearCheckoutState(userId: string): void {
  write(userId, {})
}

/** Chave de idempotência: 128 bits aleatórios, gerada uma vez por tentativa de compra. */
export function newIdempotencyKey(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return `idem_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
}
