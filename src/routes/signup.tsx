import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AuthScreen } from '@/features/auth/components/auth-screen'
import { redirectIfAuthenticated } from '@/features/auth/guards'

export const Route = createFileRoute('/signup')({
  // ?redirect=/caminho: para onde voltar depois de entrar (validado por safeRedirect).
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: redirectIfAuthenticated,
  component: SignupPage,
})

function SignupPage() {
  const { redirect: redirectTo } = Route.useSearch()
  return <AuthScreen mode="signup" redirectTo={redirectTo} />
}
