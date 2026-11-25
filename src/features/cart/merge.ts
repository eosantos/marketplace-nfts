import { maxQuantity } from '@/features/nft/editions'
import type { Cart, CartItemInput, Nft } from '@/shared/contracts'

export interface MergePlan {
  /** O que será enviado a POST /cart/items (já respeitando o limite de cada edição). */
  toAdd: CartItemInput[]
  /** Avisos para o usuário sobre itens ajustados ou ignorados. */
  notes: string[]
}

/**
 * Planeja a mescla do carrinho de visitante no carrinho da conta: soma quantidades dos mesmos
 * NFT + edição sem passar de `min(disponível, limite por comprador)` e sem duplicar linhas.
 */
export function planGuestMerge(
  guest: CartItemInput[],
  server: Cart,
  nfts: ReadonlyMap<string, Nft>,
): MergePlan {
  const toAdd: CartItemInput[] = []
  const notes: string[] = []

  for (const item of guest) {
    const nft = nfts.get(item.nftId)
    if (!nft) {
      notes.push('Um item não está mais disponível e foi ignorado.')
      continue
    }

    const edition = nft.editions.find((candidate) => candidate.type === item.editionType)
    const existing =
      server.items.find((line) => line.nftId === item.nftId && line.editionType === item.editionType)?.quantity ?? 0
    const allowed = maxQuantity(edition) - existing

    if (allowed <= 0) {
      notes.push(`${nft.name} (${item.editionType}) já está no limite e não foi somado.`)
      continue
    }

    const quantity = Math.min(item.quantity, allowed)
    if (quantity < item.quantity) {
      notes.push(`${nft.name} (${item.editionType}) foi ajustado para o limite de ${quantity}.`)
    }
    toAdd.push({ nftId: item.nftId, editionType: item.editionType, quantity })
  }

  return { toAdd, notes }
}
