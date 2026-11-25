import { Link, useRouterState } from '@tanstack/react-router'
import { LogIn, ShoppingCart } from 'lucide-react'
import { useSession } from '@/features/auth/hooks'
import { HeaderSearch } from '@/features/catalog/components/header-search'
import { useCartCount } from '@/features/cart/use-cart-count'
import { cn } from '@/shared/lib/utils'
import { RealtimeStatusDot } from './realtime-status'
import { UserMenu } from './user-menu'

// Seções fora do escopo do desafio: aparecem como no Figma, mas não navegam.
const OUT_OF_SCOPE_NAV = ['Mercado', 'Criadores', 'Aprenda'] as const

const HOME_PATHS = ['/', '/login', '/signup', '/profile', '/wallets']

function navItemClass(active: boolean): string {
  return cn(
    'relative flex h-[68px] items-center text-sm transition-colors',
    active
      ? 'font-bold text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-accent'
      : 'text-foreground hover:text-accent',
  )
}

/** Cabeçalho do desktop (no mobile cada tela tem a própria barra, conforme o Figma). */
export function SiteHeader() {
  const { user } = useSession()
  const cartCount = useCartCount()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <header className="hidden md:block">
      <div className="mx-auto grid h-[68px] max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center border-b border-border">
        <Link to="/" className="text-sm font-bold tracking-[0.2em]">
          KURIO
        </Link>

        <nav aria-label="Principal" className="flex items-center gap-10">
          <Link to="/" className={navItemClass(HOME_PATHS.includes(pathname))}>
            Início
          </Link>
          {OUT_OF_SCOPE_NAV.map((label) => (
            <span
              key={label}
              aria-disabled="true"
              title="Em breve"
              className="flex h-[68px] cursor-not-allowed items-center text-sm text-foreground/80"
            >
              {label}
            </span>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-5">
          <HeaderSearch />

          <Link
            to="/cart"
            aria-label={cartCount > 0 ? `Carrinho, ${cartCount} itens` : 'Carrinho'}
            className="relative text-foreground transition-colors hover:text-accent"
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {cartCount > 0 ? (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent">
                {cartCount}
              </span>
            ) : null}
          </Link>

          {user ? <RealtimeStatusDot /> : null}

          {user ? (
            <UserMenu user={user} />
          ) : (
            <Link
              to="/login"
              className="inline-flex h-9 items-center gap-2 rounded bg-accent px-3 text-sm font-bold text-on-accent transition-opacity hover:opacity-90"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
