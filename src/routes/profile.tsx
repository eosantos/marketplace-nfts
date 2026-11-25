import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/features/account/components/profile-page'
import { requireAuth } from '@/features/auth/guards'
import { SiteFooter } from '@/shared/layout/site-footer'

export const Route = createFileRoute('/profile')({
  beforeLoad: requireAuth,
  component: ProfileRoutePage,
})

function ProfileRoutePage() {
  return (
    <>
      <main className="mx-auto max-w-[1200px] px-5 pb-12 md:px-0 md:pb-0">
        <ProfilePage />
      </main>
      <SiteFooter />
    </>
  )
}
