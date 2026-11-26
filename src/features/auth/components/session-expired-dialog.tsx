import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useRouter } from '@tanstack/react-router'
import { Button } from '@/shared/ui/button'
import { DialogOverlay, DialogPortal } from '@/shared/ui/dialog'
import { resetClientState } from '../lifecycle'
import { safeRedirect } from '../redirect'
import { closeSessionExpired, useSessionExpired } from '../session-expired-store'

/** Não pode ser dispensado por Esc ou clique fora: o usuário escolhe como seguir. */
export function SessionExpiredDialog() {
  const router = useRouter()
  const { open, returnTo } = useSessionExpired()

  const signInAgain = () => {
    const target = safeRedirect(returnTo)
    closeSessionExpired()
    router.history.push(`/login?redirect=${encodeURIComponent(target)}`)
  }

  const continueAsGuest = () => {
    closeSessionExpired()
    resetClientState()
    router.history.push('/')
  }

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPortal>
        <DialogOverlay className="z-[60]" />
        <DialogPrimitive.Content
          onEscapeKeyDown={(event) => {
            event.preventDefault()
          }}
          onInteractOutside={(event) => {
            event.preventDefault()
          }}
          className="fixed left-1/2 top-1/2 z-[60] grid w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 gap-4 border-b-8 border-accent bg-surface p-6 text-foreground outline-none"
        >
          <DialogPrimitive.Title className="text-lg font-bold">
            Sua sessão expirou
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-sm text-muted-foreground">
            Por segurança, entre novamente para continuar de onde parou.
          </DialogPrimitive.Description>
          <div className="mt-2 grid gap-2">
            <Button size="lg" className="w-full font-bold" onClick={signInAgain}>
              Entrar novamente
            </Button>
            <Button variant="outline" size="lg" className="w-full" onClick={continueAsGuest}>
              Continuar como visitante
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  )
}
