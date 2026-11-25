import { useSyncExternalStore } from 'react'
import { z } from 'zod'
import { maxQuantity } from '@/features/nft/editions'
import { CartItemInputSchema, type CartItemInput, type Nft, type NftEditionType } from '@/shared/contracts'

// Carrinho do visitante: vive em localStorage (sobrevive ao refresh) e é mesclado ao carrinho da
// conta quando ele entra (merge-guest-cart). Não há cotação para visitante: os totais exigem login.
export const GUEST_CART_KEY = 'kurio:guest-cart'

const GuestCartSchema = z.array(CartItemInputSchema)

export type GuestAddResult = { ok: true; items: CartItemInput[] } | { ok: false; message: string }

const sameLine = (item: CartItemInput, nftId: string, editionType: NftEditionType) =>
  item.nftId === nftId && item.editionType === editionType

// ---- Regras puras (testáveis) ----

/** Soma ao item existente respeitando `min(disponível, limite por comprador)`; sem linhas duplicadas. */
export function addToGuestItems(items: CartItemInput[], nft: Nft, input: CartItemInput): GuestAddResult {
  const edition = nft.editions.find((candidate) => candidate.type === input.editionType)
  const max = maxQuantity(edition)
  if (max === 0) return { ok: false, message: 'Edição esgotada.' }

  const existing = items.find((item) => sameLine(item, input.nftId, input.editionType))
  const next = (existing?.quantity ?? 0) + input.quantity
  if (next > max) {
    return { ok: false, message: `Quantidade acima do permitido: máximo de ${max} unidade(s) nesta edição.` }
  }

  return {
    ok: true,
    items: existing
      ? items.map((item) => (item === existing ? { ...item, quantity: next } : item))
      : [...items, { ...input }],
  }
}

export function setGuestItemQuantity(
  items: CartItemInput[],
  nftId: string,
  editionType: NftEditionType,
  quantity: number,
): CartItemInput[] {
  return items.map((item) => (sameLine(item, nftId, editionType) ? { ...item, quantity } : item))
}

export function removeGuestItem(items: CartItemInput[], nftId: string, editionType: NftEditionType): CartItemInput[] {
  return items.filter((item) => !sameLine(item, nftId, editionType))
}

export function countGuestUnits(items: CartItemInput[]): number {
  return items.reduce((total, item) => total + item.quantity, 0)
}

// ---- Armazenamento ----

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function readStored(): CartItemInput[] {
  try {
    const raw = storage()?.getItem(GUEST_CART_KEY)
    if (!raw) return []
    const parsed = GuestCartSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

let current: CartItemInput[] = readStored()
const listeners = new Set<() => void>()

function commit(next: CartItemInput[]): void {
  current = next
  try {
    if (next.length === 0) storage()?.removeItem(GUEST_CART_KEY)
    else storage()?.setItem(GUEST_CART_KEY, JSON.stringify(next))
  } catch {
    // Sem localStorage: o carrinho vale só em memória.
  }
  for (const listener of listeners) listener()
}

export function getGuestCart(): CartItemInput[] {
  return current
}

export function reloadGuestCart(): void {
  current = readStored()
  for (const listener of listeners) listener()
}

export function addToGuestCart(nft: Nft, input: CartItemInput): GuestAddResult {
  const result = addToGuestItems(current, nft, input)
  if (result.ok) commit(result.items)
  return result
}

export function updateGuestQuantity(nftId: string, editionType: NftEditionType, quantity: number): void {
  commit(setGuestItemQuantity(current, nftId, editionType, quantity))
}

export function removeFromGuestCart(nftId: string, editionType: NftEditionType): void {
  commit(removeGuestItem(current, nftId, editionType))
}

export function clearGuestCart(): void {
  commit([])
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useGuestCart(): CartItemInput[] {
  return useSyncExternalStore(subscribe, getGuestCart, getGuestCart)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === GUEST_CART_KEY || event.key === null) reloadGuestCart()
  })
}
