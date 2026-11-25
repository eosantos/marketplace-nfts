import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/profile')({
  component: PlaceholderPage,
})

function PlaceholderPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-primary">Perfil</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Tela de perfil em implementação (Etapa 08).
      </p>
    </main>
  )
}
