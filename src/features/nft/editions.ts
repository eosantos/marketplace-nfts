import type { Nft, NftEdition, NftEditionType } from '@/shared/contracts'

/** Edição selecionada por padrão: 1/50 (como no Figma) se houver estoque; senão a primeira com estoque. */
export function pickDefaultEdition(editions: NftEdition[]): NftEditionType {
  const preferred = editions.find((edition) => edition.type === '1/50' && edition.available > 0)
  const fallback = editions.find((edition) => edition.available > 0)
  return (preferred ?? fallback ?? editions[0]).type
}

/** Máximo por compra = min(disponível, limite por comprador). 0 quando esgotada. */
export function maxQuantity(edition: NftEdition | undefined): number {
  if (!edition || edition.available <= 0) return 0
  return Math.min(edition.available, edition.quantityLimit)
}

/** Edição usada pelo "adicionar ao carrinho" rápido dos cards: a aberta, senão a primeira com estoque. */
export function pickQuickAddEdition(nft: Nft): NftEdition | undefined {
  const open = nft.editions.find((edition) => edition.type === 'ABERTA' && edition.available > 0)
  return open ?? nft.editions.find((edition) => edition.available > 0)
}

/** Mensagem acessível sobre estoque e limite da edição escolhida. */
export function availabilityMessage(edition: NftEdition | undefined): string {
  if (!edition || edition.available <= 0) return 'Esta edição está esgotada.'
  const max = maxQuantity(edition)
  const available = edition.available === 1 ? '1 disponível' : `${edition.available} disponíveis`
  return `Máximo de ${max} unidade${max === 1 ? '' : 's'} por compra · ${available}.`
}

/** "0x7A42E8C1...F6" -> "0x7A42...A5F6" */
export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
