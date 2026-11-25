import {
  CartItemInputSchema,
  CartItemUpdateSchema,
  type Cart,
  type OkResponse,
} from '@/shared/contracts'
import { mutateDb } from '../db'
import { nextSequence } from '../db/sequences'
import type { MockDb } from '../db/types'
import { fail, ok, validationFail, type ServiceResult } from '../http/result'
import { checkCapacity } from './capacity'

const OK_BODY: OkResponse = { ok: true }

function getOrCreateCart(db: MockDb, userId: string): Cart {
  const existing = db.carts.find((cart) => cart.userId === userId)
  if (existing) return existing

  const cart: Cart = { userId, items: [], updatedAt: new Date().toISOString() }
  db.carts.push(cart)
  return cart
}

export function getCart(userId: string): ServiceResult<Cart> {
  return ok(structuredClone(mutateDb((db) => getOrCreateCart(db, userId))))
}

/** Adiciona ou incrementa o par nftId + editionType. */
export function addCartItem(userId: string, input: unknown): ServiceResult<Cart> {
  const parsed = CartItemInputSchema.safeParse(input)
  if (!parsed.success) return validationFail(parsed.error)

  const data = parsed.data

  return mutateDb((db): ServiceResult<Cart> => {
    const cart = getOrCreateCart(db, userId)
    const existing = cart.items.find(
      (item) => item.nftId === data.nftId && item.editionType === data.editionType,
    )

    const capacity = checkCapacity(
      db,
      data.nftId,
      data.editionType,
      (existing?.quantity ?? 0) + data.quantity,
    )
    if (!capacity.ok) return capacity

    if (existing) {
      existing.quantity += data.quantity
    } else {
      cart.items.push({
        id: `cart_item_${nextSequence(db, 'cartItem')}`,
        nftId: data.nftId,
        editionType: data.editionType,
        quantity: data.quantity,
      })
    }
    cart.updatedAt = new Date().toISOString()
    return ok(structuredClone(cart))
  })
}

function findItemOwner(db: MockDb, itemId: string): Cart | undefined {
  return db.carts.find((cart) => cart.items.some((item) => item.id === itemId))
}

export function updateCartItem(userId: string, itemId: string, input: unknown): ServiceResult<Cart> {
  const parsed = CartItemUpdateSchema.safeParse(input)
  if (!parsed.success) return validationFail(parsed.error)

  return mutateDb((db): ServiceResult<Cart> => {
    const owner = findItemOwner(db, itemId)
    if (!owner) return fail('NOT_FOUND', 'Item do carrinho não encontrado.')
    if (owner.userId !== userId) return fail('FORBIDDEN', 'Este item pertence a outro usuário.')

    const item = owner.items.find((candidate) => candidate.id === itemId)
    if (!item) return fail('NOT_FOUND', 'Item do carrinho não encontrado.')

    const capacity = checkCapacity(db, item.nftId, item.editionType, parsed.data.quantity)
    if (!capacity.ok) return capacity

    item.quantity = parsed.data.quantity
    owner.updatedAt = new Date().toISOString()
    return ok(structuredClone(owner))
  })
}

export function removeCartItem(userId: string, itemId: string): ServiceResult<Cart> {
  return mutateDb((db): ServiceResult<Cart> => {
    const owner = findItemOwner(db, itemId)
    if (!owner) return fail('NOT_FOUND', 'Item do carrinho não encontrado.')
    if (owner.userId !== userId) return fail('FORBIDDEN', 'Este item pertence a outro usuário.')

    owner.items = owner.items.filter((item) => item.id !== itemId)
    owner.updatedAt = new Date().toISOString()
    return ok(structuredClone(owner))
  })
}

export function clearCart(userId: string): ServiceResult<OkResponse> {
  mutateDb((db) => {
    const cart = getOrCreateCart(db, userId)
    cart.items = []
    cart.updatedAt = new Date().toISOString()
  })
  return ok(OK_BODY)
}
