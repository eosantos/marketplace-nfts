import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { parseApiError } from '@/shared/api/errors'
import { Button } from '@/shared/ui/button'
import { applyApiFieldErrors } from '../form-errors'
import { useRegister } from '../hooks'
import { safeRedirect } from '../redirect'
import { signupFormSchema, type SignupFormValues } from '../schemas'
import { PasswordField, TextField } from './text-field'

export function SignupForm({ redirectTo }: { redirectTo: string | undefined }) {
  const router = useRouter()
  const registerAccount = useRegister()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { userName: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      // O Figma pede só usuário, e-mail e senha: nome de exibição e do perfil partem do usuário
      // e podem ser editados depois em "Perfil do colecionador".
      await registerAccount.mutateAsync({
        email: values.email,
        password: values.password,
        userName: values.userName,
        displayName: values.userName,
        profileName: values.userName,
      })
      router.history.push(safeRedirect(redirectTo))
    } catch (error) {
      const apiError = parseApiError(error)
      const mapped = applyApiFieldErrors(apiError, setError, {
        email: 'email',
        password: 'password',
        userName: 'userName',
        displayName: 'userName',
        profileName: 'userName',
      })
      if (!mapped) setFormError(apiError.message)
    }
  })

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void onSubmit(event)
      }}
      className="grid gap-3"
    >
      <TextField
        label="Nome de usuário"
        autoComplete="username"
        placeholder="Nome de usuário"
        error={errors.userName?.message}
        {...register('userName')}
      />
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="Digite seu e-mail"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        label="Senha"
        autoComplete="new-password"
        placeholder="Senha"
        error={errors.password?.message}
        {...register('password')}
      />
      <PasswordField
        label="Confirmar senha"
        autoComplete="new-password"
        placeholder="Confirmar senha"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      {formError ? (
        <p role="alert" className="rounded border border-danger/40 px-3 py-2 text-xs text-danger">
          {formError}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="mt-3 w-full font-bold md:h-[45px] md:text-base max-md:h-12 max-md:rounded-xl"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Criando conta...' : 'Criar conta'}
      </Button>
    </form>
  )
}
