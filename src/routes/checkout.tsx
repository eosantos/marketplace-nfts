import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guards'
import { CheckoutPage } from '@/features/checkout/components/checkout-page'
import { SiteFooter } from '@/shared/layout/site-footer'

export const Route = createFileRoute('/checkout')({
  beforeLoad: requireAuth,
  component: CheckoutRoutePage,
})

function CheckoutRoutePage() {
  return (
    <>
      <main className="mx-auto max-w-[1200px] px-5 pb-12 md:px-0 md:pb-0">
        <CheckoutPage />
      </main>
      <SiteFooter />
    </>
  )
}
