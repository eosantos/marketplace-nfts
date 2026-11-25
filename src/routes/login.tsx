import { createFileRoute } from '@tanstack/react-router'
import { RoutePlaceholder } from '@/shared/ui/route-placeholder'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return <RoutePlaceholder title="Entrar" screen="desktop-login.png e mobile-login.png" stage="02" />
}
