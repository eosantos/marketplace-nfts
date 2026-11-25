import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@fontsource-variable/roboto-mono'
// routeTree.gen.ts é gerado pelo @tanstack/router-plugin
import { routeTree } from '../routeTree.gen'
import { Toaster } from '@/shared/ui/sonner'
import './globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

const router = createRouter({
  routeTree,
  context: { queryClient },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

async function bootstrap() {
  // Mocks ligados por padrão (dev e demonstração); desligue com VITE_ENABLE_MOCKS=false.
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    const { startMocks } = await import('../mocks/browser')
    await startMocks()
  }

  const root = document.getElementById('root')!
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </StrictMode>,
  )
}

void bootstrap()
