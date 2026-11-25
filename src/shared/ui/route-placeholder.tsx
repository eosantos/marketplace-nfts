import { Link } from '@tanstack/react-router'

interface RoutePlaceholderProps {
  title: string
  screen: string
  stage: string
}

// Casca temporária das telas; cada etapa substitui o conteúdo.
export function RoutePlaceholder({ title, screen, stage }: RoutePlaceholderProps) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[1200px] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Tela em construção. Referência visual: {screen}. Implementação prevista na etapa {stage}.
      </p>
      <Link to="/" className="text-sm text-accent underline-offset-4 hover:underline">
        Voltar ao início
      </Link>
    </main>
  )
}
