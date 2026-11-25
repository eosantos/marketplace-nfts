import { FavoriteInputSchema, type Favorite, type Nft, type OkResponse } from '@/shared/contracts'
import { getDb, mutateDb } from '../db'
import { fail, ok, validationFail, type ServiceResult } from '../http/result'

const OK_BODY: OkResponse = { ok: true }

export function listFavorites(userId: string): ServiceResult<Nft[]> {
  const db = getDb()
  const nfts = db.favorites
    .filter((favorite) => favorite.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((favorite) => db.nfts.find((nft) => nft.id === favorite.nftId))
    .filter((nft): nft is Nft => nft !== undefined)
  return ok(nfts)
}

/** Idempotente para o mesmo par usuário/NFT. */
export function addFavorite(userId: string, input: unknown): ServiceResult<Favorite> {
  const parsed = FavoriteInputSchema.safeParse(input)
  if (!parsed.success) return validationFail(parsed.error)

  const { nftId } = parsed.data
  if (!getDb().nfts.some((nft) => nft.id === nftId)) return fail('NOT_FOUND', 'NFT não encontrado.')

  return mutateDb((db): ServiceResult<Favorite> => {
    const existing = db.favorites.find(
      (favorite) => favorite.userId === userId && favorite.nftId === nftId,
    )
    if (existing) return ok(existing)

    const favorite: Favorite = { userId, nftId, createdAt: new Date().toISOString() }
    db.favorites.push(favorite)
    return ok(favorite)
  })
}

export function removeFavorite(userId: string, nftId: string): ServiceResult<OkResponse> {
  if (!getDb().nfts.some((nft) => nft.id === nftId)) return fail('NOT_FOUND', 'NFT não encontrado.')

  mutateDb((db) => {
    db.favorites = db.favorites.filter(
      (favorite) => !(favorite.userId === userId && favorite.nftId === nftId),
    )
  })
  return ok(OK_BODY)
}
