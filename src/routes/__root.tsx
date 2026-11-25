import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { SessionExpiredDialog } from '@/features/auth/components/session-expired-dialog'
import { PendingActionRunner } from '@/shared/layout/pending-action-runner'
import { RealtimeAnnouncer } from '@/shared/layout/realtime-announcer'
import { SiteHeader } from '@/shared/layout/site-header'

function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[1200px] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm text-accent-strong">404</p>
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        O endereço que você acessou não existe ou foi movido.
      </p>
      <Link to="/" className="text-sm text-accent underline-offset-4 hover:underline">
        Voltar ao início
      </Link>
    </main>
  )
}

function RootLayout() {
  return (
    <>
      <SiteHeader />
      <Outlet />
      <SessionExpiredDialog />
      <PendingActionRunner />
      <RealtimeAnnouncer />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})
