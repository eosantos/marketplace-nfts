import type { NftEditionType } from '@/shared/contracts'
import type { MockDb } from '../db/types'
import { fail, ok, type ServiceResult } from '../http/result'

/** Limite por linha = min(disponível, limite por comprador). */
export function checkCapacity(
  db: MockDb,
  nftId: string,
  editionType: NftEditionType,
  desired: number,
): ServiceResult<null> {
  const nft = db.nfts.find((candidate) => candidate.id === nftId)
  if (!nft) return fail('NOT_FOUND', 'NFT não encontrado.')

  const edition = nft.editions.find((candidate) => candidate.type === editionType)
  if (!edition) return fail('NOT_FOUND', 'Edição não encontrada para este NFT.')

  if (edition.available === 0) return fail('AVAILABILITY_CONFLICT', 'Edição esgotada.')

  const limit = Math.min(edition.available, edition.quantityLimit)
  if (desired > limit) {
    return fail(
      'AVAILABILITY_CONFLICT',
      `Quantidade acima do permitido: máximo de ${limit} unidade(s) nesta edição.`,
    )
  }
  return ok(null)
}
