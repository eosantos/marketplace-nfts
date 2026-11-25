import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

// Agrupa dependências estáveis em chunks próprios: o navegador baixa em paralelo e mantém em cache
// entre deploys. Só pacotes de runtime do app; MSW e socket.io-client continuam em import dinâmico.
function vendorChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined
  if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react'
  if (/node_modules\/@tanstack\/(react-router|router-core|history)/.test(id)) return 'vendor-router'
  if (/node_modules\/@tanstack\/(react-query|query-core)/.test(id)) return 'vendor-query'
  if (/node_modules\/(react-hook-form|@hookform|zod)\//.test(id)) return 'vendor-forms'
  if (/node_modules\/(@radix-ui|lucide-react|sonner|class-variance-authority)/.test(id)) return 'vendor-ui'
  return undefined
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // autoCodeSplitting: cada rota vira um chunk carregado sob demanda (beforeLoad fica no principal).
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: { manualChunks: vendorChunk },
    },
  },
  server: {
    port: 5173,
  },
})
