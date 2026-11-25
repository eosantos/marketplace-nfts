import { createFileRoute } from '@tanstack/react-router'
import { WalletsPage } from '@/features/account/components/wallets-page'
import { requireAuth } from '@/features/auth/guards'
import { SiteFooter } from '@/shared/layout/site-footer'

export const Route = createFileRoute('/wallets')({
  beforeLoad: requireAuth,
  component: WalletsRoutePage,
})

function WalletsRoutePage() {
  return (
    <>
      <main className="mx-auto max-w-[1200px] px-5 pb-12 md:px-0 md:pb-0">
        <WalletsPage />
      </main>
      <SiteFooter />
    </>
  )
}
