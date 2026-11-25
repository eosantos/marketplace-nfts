import { z } from 'zod'
import { NftEditionTypeSchema } from '@/shared/contracts'

// Ação que o visitante tentou fazer antes de entrar (favoritar, comprar). Fica em sessionStorage
// e é executada uma única vez quando ele volta autenticado (PendingActionRunner).
const PENDING_KEY = 'kurio:pending-action'

export const PendingActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('favorite'), nftId: z.string() }),
  z.object({
    type: z.literal('add-to-cart'),
    nftId: z.string(),
    editionType: NftEditionTypeSchema,
    quantity: z.number().int().min(1),
    /** "Comprar": depois de adicionar, segue para o carrinho. */
    buyNow: z.boolean(),
  }),
])

export type PendingAction = z.infer<typeof PendingActionSchema>

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage
  } catch {
    return null
  }
}

export function setPendingAction(action: PendingAction): void {
  try {
    storage()?.setItem(PENDING_KEY, JSON.stringify(action))
  } catch {
    // Sem sessionStorage: a ação simplesmente não é retomada.
  }
}

/** Lê e remove a ação pendente (nunca executa duas vezes). Dados inválidos são descartados. */
export function takePendingAction(): PendingAction | null {
  const store = storage()
  if (!store) return null

  try {
    const raw = store.getItem(PENDING_KEY)
    store.removeItem(PENDING_KEY)
    if (!raw) return null
    const parsed = PendingActionSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/** Caminho atual (com query e hash) para voltar depois do login. */
export function currentHref(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

export function loginUrlFor(href: string): string {
  return `/login?redirect=${encodeURIComponent(href)}`
}
