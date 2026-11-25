import { createFileRoute, useRouter } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guards'
import { useSession } from '@/features/auth/hooks'
import { OrderStatusView } from '@/features/checkout/components/order-status'
import { SiteFooter } from '@/shared/layout/site-footer'
import { Skeleton } from '@/shared/ui/skeleton'

export const Route = createFileRoute('/order/$orderId')({
  beforeLoad: requireAuth,
  component: OrderPage,
})

/** Recibo. Mostra a confirmação só se o pedido está CONFIRMADO; pendente e recusado têm a sua tela. */
function OrderPage() {
  const { orderId } = Route.useParams()
  const router = useRouter()
  const { user } = useSession()

  return (
    <>
      <main className="mx-auto max-w-[1200px] px-5 py-8 md:px-0 md:py-12">
        {user ? (
          <OrderStatusView
            userId={user.id}
            orderId={orderId}
            mode="page"
            onRetry={() => {
              router.history.push('/checkout')
            }}
          />
        ) : (
          <Skeleton className="mx-auto h-[480px] w-full max-w-[580px]" />
        )}
      </main>
      <SiteFooter />
    </>
  )
}
