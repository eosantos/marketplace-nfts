import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guards'
import { RoutePlaceholder } from '@/shared/ui/route-placeholder'

export const Route = createFileRoute('/wallets')({
  beforeLoad: requireAuth,
  component: WalletsPage,
})

function WalletsPage() {
  return <RoutePlaceholder title="Carteiras" screen="desktop-carteiras.png" stage="08" />
}
