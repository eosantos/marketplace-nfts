import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nft/$nftId')({
  component: PlaceholderPage,
})

function PlaceholderPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-primary">Detalhe do NFT</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Tela de detalhe em implementação (Etapa 04).
      </p>
    </main>
  )
}
