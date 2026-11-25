import { createFileRoute } from '@tanstack/react-router'
import { RoutePlaceholder } from '@/shared/ui/route-placeholder'

export const Route = createFileRoute('/wallets')({
  component: WalletsPage,
})

function WalletsPage() {
  return <RoutePlaceholder title="Carteiras" screen="desktop-carteiras.png" stage="08" />
}
