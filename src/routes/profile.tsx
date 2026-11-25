import { createFileRoute } from '@tanstack/react-router'
import { RoutePlaceholder } from '@/shared/ui/route-placeholder'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  return <RoutePlaceholder title="Perfil do colecionador" screen="desktop-perfil.png" stage="08" />
}
