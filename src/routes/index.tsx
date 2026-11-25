import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: PlaceholderPage,
})

function PlaceholderPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold text-primary">NFT Marketplace</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Ambiente configurado. As telas serão implementadas a partir da Etapa 01.
      </p>
      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <span>Stack ativa:</span>
        <code className="rounded bg-secondary px-2 py-1 text-xs">
          React · TypeScript · TanStack Router · TanStack Query · Tailwind · shadcn/ui · MSW
        </code>
      </div>
    </main>
  )
}
