import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guards'
import { RoutePlaceholder } from '@/shared/ui/route-placeholder'

export const Route = createFileRoute('/profile')({
  beforeLoad: requireAuth,
  component: ProfilePage,
})

function ProfilePage() {
  return <RoutePlaceholder title="Perfil do colecionador" screen="desktop-perfil.png" stage="08" />
}
