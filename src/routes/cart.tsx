import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '@/features/cart/components/cart-page'
import { SiteFooter } from '@/shared/layout/site-footer'

// Pública: visitante monta o carrinho localmente; a cotação e o checkout exigem login.
export const Route = createFileRoute('/cart')({
  component: CartRoutePage,
})

function CartRoutePage() {
  return (
    <>
      <main className="relative mx-auto max-w-[1200px] px-5 pb-12 md:px-0 md:pb-0">
        <CartPage />
      </main>
      <SiteFooter />
    </>
  )
}
