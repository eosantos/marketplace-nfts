import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

// Cliente único do TanStack Query (usado pela app, pelos interceptores e pelo logout).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Uma nova tentativa só para falhas de rede ou 5xx; respostas 4xx não se repetem.
      retry: (failureCount, error) => {
        if (isAxiosError(error) && error.response && error.response.status < 500) return false
        return failureCount < 1
      },
    },
  },
})
