import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { applyApiFieldErrors } from '@/features/auth/form-errors'
import { PasswordField } from '@/features/auth/components/text-field'
import { useChangePassword } from '@/features/profile/hooks'
import { passwordFormSchema, type PasswordFormValues } from '@/features/profile/schemas'
import { parseApiError } from '@/shared/api/errors'
import { Button } from '@/shared/ui/button'

export function PasswordForm() {
  const change = useChangePassword()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit((values) => {
    setFormError(null)
    change.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          reset()
          toast.success('Senha alterada. Os outros dispositivos foram desconectados.')
        },
        onError: (failure) => {
          const apiError = parseApiError(failure)
          const applied = applyApiFieldErrors(apiError, setError, {
            currentPassword: 'currentPassword',
            newPassword: 'newPassword',
          })
          if (!applied) setFormError(apiError.message)
        },
      },
    )
  })

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="grid gap-4" aria-labelledby="password-title">
      <h2 id="password-title" className="text-lg font-bold">
        Alterar senha
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PasswordField
          label="Senha atual"
          placeholder="Senha atual"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <div className="hidden md:block" aria-hidden="true" />
        <PasswordField
          label="Nova senha"
          placeholder="Nova senha"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <PasswordField
          label="Confirmar nova senha"
          placeholder="Confirmar nova senha"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>
      {formError ? (
        <p role="alert" className="text-xs text-danger">
          {formError}
        </p>
      ) : null}
      <Button type="submit" className="justify-self-start max-md:w-full" disabled={change.isPending}>
        {change.isPending ? 'Salvando...' : 'Alterar senha'}
      </Button>
    </form>
  )
}
