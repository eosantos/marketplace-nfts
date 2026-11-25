import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import '@fontsource-variable/roboto-mono'
// routeTree.gen.ts é gerado pelo @tanstack/router-plugin
import { routeTree } from '../routeTree.gen'
import { onAuthenticated, setupAuth } from '@/features/auth/lifecycle'
import { mergeGuestCart } from '@/features/cart/merge-guest-cart'
import { setupRealtime } from '@/features/realtime/setup'
import { queryClient } from '@/shared/api/query-client'
import { Toaster } from '@/shared/ui/sonner'
import './globals.css'

// Injeta o token Bearer e o tratamento de 401 no cliente HTTP.
setupAuth()
onAuthenticated(mergeGuestCart)

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

  // Depois dos mocks: o servidor Socket.IO simulado precisa existir antes da primeira conexão.
  setupRealtime()

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
