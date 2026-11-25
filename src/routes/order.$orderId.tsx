import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guards'
import { RoutePlaceholder } from '@/shared/ui/route-placeholder'

export const Route = createFileRoute('/order/$orderId')({
  beforeLoad: requireAuth,
  component: OrderConfirmationPage,
})

function OrderConfirmationPage() {
  const { orderId } = Route.useParams()
  return (
    <RoutePlaceholder
      title={`Confirmação do pedido ${orderId}`}
      screen="desktop-confirmacao-pedido.png"
      stage="07"
    />
  )
}
