import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { SessionExpiredDialog } from '@/features/auth/components/session-expired-dialog'
import { NotFoundPage } from '@/shared/layout/not-found-page'
import { PendingActionRunner } from '@/shared/layout/pending-action-runner'
import { RealtimeAnnouncer } from '@/shared/layout/realtime-announcer'
import { SiteHeader } from '@/shared/layout/site-header'

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
