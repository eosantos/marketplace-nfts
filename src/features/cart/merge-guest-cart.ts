import { toast } from 'sonner'
import { fetchNft } from '@/features/nft/api'
import { queryClient } from '@/shared/api/query-client'
import { qk } from '@/shared/api/query-keys'
import type { AuthResponse, Nft } from '@/shared/contracts'
import { addCartItemRequest, fetchCartRequest } from './api'
import { clearGuestCart, getGuestCart } from './guest-cart'
import { planGuestMerge } from './merge'

/**
 * Chamado ao entrar: soma o carrinho de visitante ao da conta (respeitando limites) e o limpa.
 * Se algo falhar, os itens continuam guardados no dispositivo para a próxima tentativa.
 */
export async function mergeGuestCart(auth: AuthResponse): Promise<void> {
  const guest = getGuestCart()
  if (guest.length === 0) return

  try {
    const server = await fetchCartRequest()
    const ids = [...new Set(guest.map((item) => item.nftId))]
    const found = await Promise.all(ids.map((id) => fetchNft(id).catch(() => undefined)))
    const nfts = new Map<string, Nft>()
    for (const nft of found) if (nft) nfts.set(nft.id, nft)

    const plan = planGuestMerge(guest, server, nfts)
    let cart = server
    for (const item of plan.toAdd) cart = await addCartItemRequest(item)

    clearGuestCart()
    queryClient.setQueryData(qk.cart(auth.user.id), cart)

    toast.success(
      plan.notes.length > 0
        ? `Itens do visitante adicionados ao seu carrinho. ${plan.notes.join(' ')}`
        : 'Itens do visitante adicionados ao seu carrinho.',
    )
  } catch {
    toast.error('Não foi possível mesclar o carrinho de visitante. Seus itens continuam salvos neste dispositivo.')
  }
}

