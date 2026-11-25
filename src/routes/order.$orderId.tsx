import { createFileRoute } from '@tanstack/react-router'
import { RoutePlaceholder } from '@/shared/ui/route-placeholder'

export const Route = createFileRoute('/order/$orderId')({
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
