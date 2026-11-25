import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useCartAdd } from '@/features/cart/hooks'
import type { Nft, NftEditionType } from '@/shared/contracts'
import { maxQuantity, pickDefaultEdition } from './editions'

/**
 * Estado e ações de compra do detalhe (edição, quantidade, limite, adicionar/comprar).
 * Conta logada adiciona pela API; visitante, no carrinho local (mesclado ao entrar).
 */
export function useNftPurchase(nft: Nft) {
  const router = useRouter()
  const cart = useCartAdd()

  const [editionType, setEditionType] = useState<NftEditionType>(() => pickDefaultEdition(nft.editions))
  const [quantity, setQuantity] = useState(1)
  const [limitHit, setLimitHit] = useState(false)

  const edition = nft.editions.find((candidate) => candidate.type === editionType)
  const max = maxQuantity(edition)

  const selectEdition = (type: NftEditionType) => {
    setEditionType(type)
    setQuantity(1)
    setLimitHit(false)
  }

  const increment = () => {
    if (quantity >= max) {
      setLimitHit(true)
      return
    }
    setQuantity(quantity + 1)
    setLimitHit(false)
  }

  const decrement = () => {
    setQuantity(Math.max(1, quantity - 1))
    setLimitHit(false)
  }

  /** `buyNow` adiciona e segue para o carrinho; sem ele só adiciona. */
  const submit = (buyNow: boolean) => {
    if (max === 0) return
    cart.add(nft, { nftId: nft.id, editionType, quantity }, () => {
      if (buyNow) router.history.push('/cart')
    })
  }

  return {
    edition,
    editionType,
    quantity,
    max,
    limitHit,
    soldOut: max === 0,
    isPending: cart.isPending,
    selectEdition,
    increment,
    decrement,
    submit,
  }
}

export type NftPurchase = ReturnType<typeof useNftPurchase>
