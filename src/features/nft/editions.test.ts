import { describe, expect, it } from 'vitest'
import type { Nft, NftEdition } from '@/shared/contracts'
import {
  availabilityMessage,
  maxQuantity,
  pickDefaultEdition,
  pickQuickAddEdition,
  shortAddress,
} from './editions'

function edition(type: NftEdition['type'], available: number, quantityLimit: number): NftEdition {
  return { type, total: type === 'ABERTA' ? null : Number(type.split('/')[1]), available, quantityLimit }
}

const ALL: NftEdition[] = [
  edition('1/1', 1, 1),
  edition('1/10', 4, 2),
  edition('1/50', 20, 3),
  edition('ABERTA', 100, 5),
]

describe('pickDefaultEdition', () => {
  it('prefers 1/50 (Figma default) and falls back to the first available edition', () => {
    expect(pickDefaultEdition(ALL)).toBe('1/50')
    expect(pickDefaultEdition([edition('1/1', 1, 1), edition('1/10', 4, 2), edition('1/50', 0, 3), edition('ABERTA', 9, 5)])).toBe('1/1')
    expect(pickDefaultEdition([edition('1/1', 0, 1), edition('1/10', 0, 2), edition('1/50', 0, 3), edition('ABERTA', 7, 5)])).toBe('ABERTA')
  })

  it('returns the first edition when everything is sold out', () => {
    const soldOut = ALL.map((item) => ({ ...item, available: 0 }))
    expect(pickDefaultEdition(soldOut)).toBe('1/1')
  })
})

describe('maxQuantity and availability message', () => {
  it('is min(available, per-buyer limit) and 0 when sold out', () => {
    expect(maxQuantity(edition('1/10', 4, 2))).toBe(2)
    expect(maxQuantity(edition('1/50', 1, 3))).toBe(1)
    expect(maxQuantity(edition('ABERTA', 100, 5))).toBe(5)
    expect(maxQuantity(edition('1/1', 0, 1))).toBe(0)
    expect(maxQuantity(undefined)).toBe(0)
  })

  it('explains stock and limit in portuguese, with correct plurals', () => {
    expect(availabilityMessage(edition('1/10', 4, 2))).toBe('Máximo de 2 unidades por compra · 4 disponíveis.')
    expect(availabilityMessage(edition('1/1', 1, 1))).toBe('Máximo de 1 unidade por compra · 1 disponível.')
    expect(availabilityMessage(edition('1/1', 0, 1))).toBe('Esta edição está esgotada.')
  })
})

describe('quick add and address helpers', () => {
  it('quick add prefers the open edition, then the first with stock, otherwise nothing', () => {
    const base = { editions: ALL } as Nft
    expect(pickQuickAddEdition(base)?.type).toBe('ABERTA')
    expect(pickQuickAddEdition({ editions: [edition('1/1', 1, 1), edition('ABERTA', 0, 5)] } as Nft)?.type).toBe('1/1')
    expect(pickQuickAddEdition({ editions: [edition('1/1', 0, 1)] } as Nft)).toBeUndefined()
  })

  it('shortens contract addresses', () => {
    expect(shortAddress('0x7A42E8C1B9D0F3A4C5E6B7D8A9F0C1E2B3D4A5F6')).toBe('0x7A42...A5F6')
  })
})
