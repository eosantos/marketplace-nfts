import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/404')({
  component: PlaceholderPage,
})

function PlaceholderPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-primary">Página não encontrada</h1>
      <p className="max-w-md text-center text-muted-foreground">
        A rota solicitada não existe.
      </p>
    </main>
  )
}
