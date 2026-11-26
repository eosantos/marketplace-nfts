import { Link, useRouter } from '@tanstack/react-router'
import { Download, Heart, LogOut, MapPin, ShoppingCart, Tag, TriangleAlert, User, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useLogout } from '@/features/auth/hooks'
import { cn } from '@/shared/lib/utils'

const ACTIVE_ITEMS = [
  { to: '/profile', label: 'Dados do perfil', icon: User },
  { to: '/wallets', label: 'Carteiras', icon: MapPin },
] as const

// Fora do escopo desta entrega: ficam visíveis (como no Figma), porém desabilitados.
const SOON_ITEMS: readonly { label: string; icon: LucideIcon }[] = [
  { label: 'Atividade', icon: ShoppingCart },
  { label: 'Lista de interesse', icon: Heart },
  { label: 'Ofertas', icon: Tag },
  { label: 'Arquivos baixados', icon: Download },
  { label: 'Suporte', icon: TriangleAlert },
]

const itemClass =
  'relative flex h-11 items-center gap-3 px-5 text-sm transition-colors lg:h-[45px] lg:px-4 lg:text-[15px] lg:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'

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
    <div className="grid grid-cols-1 gap-6 py-6 md:grid-cols-[240px_minmax(0,1fr)] md:gap-10 md:py-12 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-7 lg:py-8">
      <nav aria-label="Meu perfil" className="min-w-0">
        {/* Desktop: cartão vertical */}
        <div className="hidden border border-border bg-surface md:block lg:border-0">
          <h2 className="px-5 py-4 text-sm font-bold lg:h-11 lg:px-2.5 lg:pb-0 lg:pt-3 lg:text-lg lg:leading-7">Meu perfil</h2>
          <ul>
            {ACTIVE_ITEMS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(itemClass, 'text-muted-foreground hover:text-foreground')}
                  activeProps={{
                    'aria-current': 'page',
                    className: 'text-foreground bg-background/40 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-accent lg:before:w-1.5',
                  }}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            ))}
            {SOON_ITEMS.map(({ label, icon: Icon }) => (
              <li key={label}>
                <span aria-disabled="true" className={cn(itemClass, 'cursor-not-allowed text-muted-foreground/50')}>
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  {label}
                  <span className="ml-auto text-[10px] uppercase tracking-wide lg:sr-only">Em breve</span>
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
                <LogOut className="hidden h-[18px] w-[18px] shrink-0 lg:block" aria-hidden="true" />
                <span className="lg:font-bold">Sair</span>
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
        <h1 className="mb-6 text-xl font-bold md:text-2xl lg:mb-8 lg:text-base">{title}</h1>
        {children}
      </div>
    </div>
  )
}
