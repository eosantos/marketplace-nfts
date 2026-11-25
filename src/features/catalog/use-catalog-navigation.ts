import { useNavigate } from '@tanstack/react-router'
import type { CatalogSearch } from './search'

interface UpdateOptions {
  replace?: boolean
  /** Mantém a página atual (padrão: qualquer filtro volta para a página 1). */
  keepPage?: boolean
}

/** Atualiza a URL do catálogo. Passe `undefined` para limpar um filtro. */
export function useCatalogNavigation() {
  const navigate = useNavigate({ from: '/' })

  return (patch: Partial<CatalogSearch>, options: UpdateOptions = {}): void => {
    void navigate({
      search: (previous) => ({
        ...previous,
        ...(options.keepPage ? {} : { page: 1 }),
        ...patch,
      }),
      replace: options.replace ?? false,
    })
  }
}
