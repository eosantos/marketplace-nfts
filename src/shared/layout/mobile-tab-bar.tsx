import { Link } from '@tanstack/react-router'
import { Heart, Home, ScanLine, ShoppingCart, User } from 'lucide-react'
import { useSession } from '@/features/auth/hooks'
import { useCartCount } from '@/features/cart/use-cart-count'

const itemClass = 'flex flex-col items-center justify-center text-muted-foreground'

/** Barra de navegação inferior da Home no mobile. Favoritos e Scan estão fora do escopo. */
export function MobileTabBar() {
  const { user } = useSession()
  const cartCount = useCartCount()

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-5 items-center rounded-t-3xl bg-surface md:hidden"
    >
      <Link to="/" aria-label="Início" className={`${itemClass} !text-accent`}>
        <Home className="h-6 w-6" aria-hidden="true" />
      </Link>
      <span aria-disabled="true" className={`${itemClass} cursor-not-allowed`}>
        <Heart className="h-6 w-6" aria-hidden="true" />
        <span className="sr-only">Favoritos (em breve)</span>
      </span>
      <span
        aria-disabled="true"
        className="mx-auto -mt-8 flex h-14 w-14 cursor-not-allowed items-center justify-center rounded-full bg-accent text-on-accent shadow-lg"
      >
        <ScanLine className="h-7 w-7" aria-hidden="true" />
        <span className="sr-only">Escanear (em breve)</span>
      </span>
      <Link
        to="/cart"
        aria-label={cartCount > 0 ? `Carrinho, ${cartCount} itens` : 'Carrinho'}
        className={`${itemClass} relative`}
      >
        <ShoppingCart className="h-6 w-6" aria-hidden="true" />
        {cartCount > 0 ? (
          <span className="absolute right-5 top-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent">
            {cartCount}
          </span>
        ) : null}
      </Link>
      <Link to={user ? '/profile' : '/login'} aria-label={user ? 'Meu perfil' : 'Entrar'} className={itemClass}>
        <User className="h-6 w-6" aria-hidden="true" />
      </Link>
    </nav>
  )
}
