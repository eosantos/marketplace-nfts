import { useRef } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Link, useRouter } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { DialogOverlay, DialogPortal } from '@/shared/ui/dialog'
import { LoginForm } from './login-form'
import { SignupForm } from './signup-form'
import { SocialButtons } from './social-buttons'

interface AuthScreenProps {
  mode: 'login' | 'signup'
  redirectTo: string | undefined
}

const COPY = {
  login: {
    title: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  },
  signup: {
    title: 'Criar perfil de colecionador',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
  },
} as const

/**
 * Desktop: modal sobre a página (abas Entrar | Criar conta). Mobile: tela cheia.
 * Fechar volta para o início. O Dialog garante foco preso, Esc e retorno de foco.
 */
export function AuthScreen({ mode, redirectTo }: AuthScreenProps) {
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)
  const isLogin = mode === 'login'
  const copy = COPY[mode]

  const tabClass = (active: boolean) =>
    active ? 'text-accent' : 'text-foreground transition-colors hover:text-accent'

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) router.history.push('/')
      }}
    >
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={contentRef}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            contentRef.current?.querySelector<HTMLInputElement>('input')?.focus()
          }}
          className="fixed z-50 overflow-y-auto bg-surface text-foreground outline-none max-md:inset-0 max-md:px-7 max-md:py-16 md:left-1/2 md:top-1/2 md:w-[500px] md:-translate-x-1/2 md:-translate-y-1/2 md:border-b-8 md:border-accent md:px-12 md:pb-14 md:pt-10"
        >
          <DialogPrimitive.Close
            aria-label="Fechar"
            className="absolute right-4 top-4 hidden rounded p-1 text-accent transition-opacity hover:opacity-80 md:block"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </DialogPrimitive.Close>

          <div className="mb-10 text-center text-3xl font-bold tracking-[0.2em] md:hidden" aria-hidden="true">
            KURIO
          </div>

          <DialogPrimitive.Title className="mb-6 text-center text-base font-bold md:sr-only">
            {copy.title}
          </DialogPrimitive.Title>

          <nav aria-label="Entrar ou criar conta" className="mb-6 hidden items-center justify-center gap-3 text-lg font-bold md:flex">
            <Link
              to="/login"
              search={{ redirect: redirectTo }}
              aria-current={isLogin ? 'page' : undefined}
              className={tabClass(isLogin)}
            >
              Entrar
            </Link>
            <span className="h-5 w-px bg-accent" aria-hidden="true" />
            <Link
              to="/signup"
              search={{ redirect: redirectTo }}
              aria-current={isLogin ? undefined : 'page'}
              className={tabClass(!isLogin)}
            >
              Criar conta
            </Link>
          </nav>

          <DialogPrimitive.Description className="mb-6 hidden text-center text-xs text-foreground md:block">
            {copy.description}
          </DialogPrimitive.Description>

          {isLogin ? <LoginForm redirectTo={redirectTo} /> : <SignupForm redirectTo={redirectTo} />}

          <div className="mt-6">
            <SocialButtons />
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground md:hidden">
            {isLogin ? (
              <>
                Novo na Kurio?{' '}
                <Link to="/signup" search={{ redirect: redirectTo }} className="text-accent underline-offset-4 hover:underline">
                  Crie uma conta
                </Link>
              </>
            ) : (
              <>
                Já tem uma conta?{' '}
                <Link to="/login" search={{ redirect: redirectTo }} className="text-accent underline-offset-4 hover:underline">
                  Entre
                </Link>
              </>
            )}
          </p>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  )
}
