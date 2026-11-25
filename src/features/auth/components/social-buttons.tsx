import { toast } from 'sonner'
import { FacebookIcon, GoogleIcon } from '@/shared/icons'

// Login social está fora do escopo do desafio: os botões seguem o Figma, mas não simulam sucesso.
function notifyUnavailable(provider: string): void {
  toast.info(`Login com ${provider} indisponível nesta demonstração.`)
}

const buttonClass =
  'flex h-10 w-full items-center justify-center gap-3 rounded border border-border text-xs font-medium text-muted-foreground transition-colors hover:border-accent hover:text-foreground max-md:h-12 max-md:rounded-xl'

export function SocialButtons() {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3 text-xs text-foreground">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <span>Ou continue com</span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>
      <button
        type="button"
        aria-disabled="true"
        onClick={() => {
          notifyUnavailable('Google')
        }}
        className={buttonClass}
      >
        <GoogleIcon width={20} height={20} />
        Continuar com Google
      </button>
      <button
        type="button"
        aria-disabled="true"
        onClick={() => {
          notifyUnavailable('Facebook')
        }}
        className={buttonClass}
      >
        <FacebookIcon width={20} height={20} />
        Continuar com Facebook
      </button>
    </div>
  )
}
