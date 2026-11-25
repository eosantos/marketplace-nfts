import { useEffect, useId, useRef, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useLogout } from '@/features/auth/hooks'
import type { User } from '@/shared/contracts'

/** Menu simples do usuário (perfil, carteiras, sair), com Esc, clique fora e aria-expanded. */
export function UserMenu({ user }: { user: User }) {
  const router = useRouter()
  const logout = useLogout()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const itemClass =
    'block w-full px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Menu de ${user.displayName}`}
        onClick={() => {
          setOpen((value) => !value)
        }}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-accent bg-surface text-sm font-bold text-accent"
      >
        {user.avatar ? (
          <img src={user.avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          user.displayName.charAt(0).toUpperCase()
        )}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-11 z-40 w-48 border border-border bg-surface py-1 shadow-lg"
        >
          <p className="truncate px-4 py-2 text-xs text-muted-foreground">{user.email}</p>
          <Link
            to="/profile"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              setOpen(false)
            }}
          >
            Meu perfil
          </Link>
          <Link
            to="/wallets"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              setOpen(false)
            }}
          >
            Carteiras
          </Link>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            disabled={logout.isPending}
            onClick={() => {
              setOpen(false)
              logout.mutate(undefined, {
                onSettled: () => {
                  router.history.push('/')
                },
              })
            }}
          >
            Sair
          </button>
        </div>
      ) : null}
    </div>
  )
}
