import { createFileRoute } from '@tanstack/react-router'
import { RoutePlaceholder } from '@/shared/ui/route-placeholder'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartPage() {
  return <RoutePlaceholder title="Carrinho de NFTs" screen="desktop-carrinho.png e mobile-carrinho.png" stage="05" />
}
