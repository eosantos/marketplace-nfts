import { useEffect, useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'

/** Campo de busca ligado à URL: debounce de 300 ms, `replace` no histórico e página volta para 1. */
export function useUrlSearchQuery() {
  const navigate = useNavigate()
  const current = useRouterState({
    select: (state) => {
      const query = (state.location.search as Record<string, unknown>).q
      return typeof query === 'string' ? query : ''
    },
  })
  const [value, setValue] = useState(current)

  // Mudanças vindas da URL (limpar filtros, voltar no histórico) atualizam o campo.
  useEffect(() => {
    setValue(current)
  }, [current])

  useEffect(() => {
    const trimmed = value.trim()
    if (trimmed === current) return undefined

    const timer = setTimeout(() => {
      void navigate({
        to: '/',
        search: (previous) => ({ ...previous, q: trimmed || undefined, page: 1 }),
        replace: true,
      })
    }, 300)
    return () => {
      clearTimeout(timer)
    }
  }, [value, current, navigate])

  return { value, setValue }
}
