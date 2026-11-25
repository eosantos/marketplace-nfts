import { Link, useRouter } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useLogout } from '@/features/auth/hooks'
import { cn } from '@/shared/lib/utils'

const ACTIVE_ITEMS = [
  { to: '/profile', label: 'Dados do perfil' },
  { to: '/wallets', label: 'Carteiras' },
] as const

// Fora do escopo desta entrega: ficam visíveis (como no Figma), porém desabilitados.
const SOON_ITEMS = ['Atividade', 'Lista de interesse', 'Ofertas', 'Arquivos baixados', 'Suporte'] as const

const itemClass =
  'relative flex h-11 items-center px-5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'

/** Moldura compartilhada de /profile e /wallets: menu "Meu perfil" + conteúdo. */
export function AccountLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter()
  const logout = useLogout()

  const signOut = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        router.history.push('/')
      },
      onError: () => {
        toast.error('Não foi possível sair. Tente novamente.')
      },
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 py-6 md:grid-cols-[240px_minmax(0,1fr)] md:gap-10 md:py-12">
      <nav aria-label="Meu perfil" className="min-w-0">
        {/* Desktop: cartão vertical */}
        <div className="hidden border border-border bg-surface md:block">
          <h2 className="px-5 py-4 text-sm font-bold">Meu perfil</h2>
          <ul>
            {ACTIVE_ITEMS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(itemClass, 'text-muted-foreground hover:text-foreground')}
                  activeProps={{
                    'aria-current': 'page',
                    className: 'text-foreground bg-background/40 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-accent',
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {SOON_ITEMS.map((label) => (
              <li key={label}>
                <span aria-disabled="true" className={cn(itemClass, 'cursor-not-allowed justify-between text-muted-foreground/50')}>
                  {label}
                  <span className="text-[10px] uppercase tracking-wide">Em breve</span>
                </span>
              </li>
            ))}
            <li className="mt-2 border-t border-border">
              <button
                type="button"
                onClick={signOut}
                disabled={logout.isPending}
                className={cn(itemClass, 'w-full text-muted-foreground hover:text-foreground disabled:opacity-50')}
              >
                Sair
              </button>
            </li>
          </ul>
        </div>

        {/* Mobile: abas horizontais + sair */}
        <div className="flex items-center gap-2 md:hidden">
          <ul className="flex min-w-0 flex-1 gap-2">
            {ACTIVE_ITEMS.map((item) => (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  className="flex h-11 items-center justify-center rounded-xl border border-border text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  activeProps={{ 'aria-current': 'page', className: 'border-accent text-foreground' }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={signOut}
            disabled={logout.isPending}
            aria-label="Sair"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </nav>

      <div className="min-w-0">
        <h1 className="mb-6 text-xl font-bold md:text-2xl">{title}</h1>
        {children}
      </div>
    </div>
  )
}
