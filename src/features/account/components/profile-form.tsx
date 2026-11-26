import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { applyApiFieldErrors } from '@/features/auth/form-errors'
import { useUpdateProfile } from '@/features/profile/hooks'
import { profileFormSchema, type ProfileFormValues } from '@/features/profile/schemas'
import { Field, fieldA11y, inputClass } from '@/features/checkout/components/fields'
import { parseApiError } from '@/shared/api/errors'
import type { Profile } from '@/shared/contracts'
import { Button } from '@/shared/ui/button'
import { AvatarEditor } from './avatar-editor'

export function ProfileForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: profile.displayName,
      userName: profile.userName,
      profileName: profile.profileName,
    },
  })

  const onSubmit = handleSubmit((values) => {
    setFormError(null)
    update.mutate(values, {
      onSuccess: (saved) => {
        reset({ displayName: saved.displayName, userName: saved.userName, profileName: saved.profileName })
        toast.success('Perfil atualizado.')
      },
      onError: (failure) => {
        const apiError = parseApiError(failure)
        const applied = applyApiFieldErrors(apiError, setError, {
          displayName: 'displayName',
          userName: 'userName',
          profileName: 'profileName',
        })
        if (!applied) setFormError(apiError.message)
      },
    })
  })

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="grid gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-x-7 lg:gap-y-7">
        <Field id="pf-display" label="Nome de exibição" required error={errors.displayName?.message}>
          <input {...fieldA11y('pf-display', errors.displayName?.message)} autoComplete="name" className={inputClass} {...register('displayName')} />
        </Field>
        <Field id="pf-user" label="Nome de usuário" required error={errors.userName?.message}>
          <input {...fieldA11y('pf-user', errors.userName?.message)} autoComplete="username" className={inputClass} {...register('userName')} />
        </Field>
        <Field id="pf-profile" label="Nome do perfil" required error={errors.profileName?.message}>
          <input {...fieldA11y('pf-profile', errors.profileName?.message)} className={inputClass} {...register('profileName')} />
        </Field>
        <div className="grid gap-1.5">
          <label htmlFor="pf-email" className="text-sm">
            E-mail
          </label>
          <input
            id="pf-email"
            type="email"
            value={profile.email}
            readOnly
            aria-describedby="pf-email-hint"
            className={`${inputClass} cursor-not-allowed text-muted-foreground`}
          />
          <p id="pf-email-hint" className="text-xs text-muted-foreground">
            O e-mail da conta não pode ser alterado.
          </p>
        </div>
      </div>

      <AvatarEditor avatar={profile.avatar} name={profile.displayName} />

      {formError ? (
        <p role="alert" className="text-xs text-danger">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="justify-self-start max-md:w-full lg:h-10 lg:w-[131px] lg:text-sm" disabled={update.isPending || !isDirty}>
        {update.isPending ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  )
}
