import { createFileRoute } from '@tanstack/react-router'
import { RoutePlaceholder } from '@/shared/ui/route-placeholder'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  return <RoutePlaceholder title="Criar conta" screen="desktop-cadastro.png e mobile-cadastro.png" stage="02" />
}
