import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { parseApiError } from '@/shared/api/errors'
import { Button } from '@/shared/ui/button'
import { applyApiFieldErrors } from '../form-errors'
import { useLogin } from '../hooks'
import { safeRedirect } from '../redirect'
import { loginFormSchema, type LoginFormValues } from '../schemas'
import { PasswordField, TextField } from './text-field'

export function LoginForm({ redirectTo }: { redirectTo: string | undefined }) {
  const router = useRouter()
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login.mutateAsync({ email: values.email, password: values.password })
      router.history.push(safeRedirect(redirectTo))
    } catch (error) {
      const apiError = parseApiError(error)
      const mapped = applyApiFieldErrors(apiError, setError, { email: 'email', password: 'password' })
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
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="Digite seu e-mail"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        label="Senha"
        autoComplete="current-password"
        placeholder="Senha"
        error={errors.password?.message}
        {...register('password')}
      />

      <button
        type="button"
        aria-disabled="true"
        onClick={() => {
          toast.info('Recuperação de senha indisponível nesta demonstração.')
        }}
        className="justify-self-end text-xs text-accent hover:underline"
      >
        Esqueceu a senha?
      </button>

      {formError ? (
        <p role="alert" className="rounded border border-danger/40 px-3 py-2 text-xs text-danger">
          {formError}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="mt-1 w-full font-bold max-md:h-12 max-md:rounded-xl" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
