import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/cart')({
  component: PlaceholderPage,
})

function PlaceholderPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-primary">Carrinho</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Tela de carrinho em implementação (Etapa 05).
      </p>
    </main>
  )
}
