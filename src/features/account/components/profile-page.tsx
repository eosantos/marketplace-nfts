import { useProfile } from '@/features/profile/hooks'
import { parseApiError } from '@/shared/api/errors'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { AccountLayout } from './account-layout'
import { PasswordForm } from './password-form'
import { ProfileForm } from './profile-form'

export function ProfilePage() {
  const profile = useProfile()

  return (
    <AccountLayout title="Perfil do colecionador">
      {profile.isPending ? (
        <div className="grid gap-4" aria-busy="true" aria-label="Carregando perfil">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : profile.isError ? (
        <div role="alert" className="grid justify-items-start gap-3">
          <p className="text-sm text-danger">{parseApiError(profile.error).message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void profile.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="grid gap-10">
          <ProfileForm key={profile.data.userId} profile={profile.data} />
          <PasswordForm />
        </div>
      )}
    </AccountLayout>
  )
}
