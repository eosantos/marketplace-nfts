import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guards'
import { RoutePlaceholder } from '@/shared/ui/route-placeholder'

export const Route = createFileRoute('/checkout')({
  beforeLoad: requireAuth,
  component: CheckoutPage,
})

function CheckoutPage() {
  return <RoutePlaceholder title="Pagamento" screen="desktop-pagamento.png e mobile-pagamento.png" stage="07" />
}
