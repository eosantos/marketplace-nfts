import { useEffect, useRef } from 'react'
import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { Button } from '@/shared/ui/button'
import { MonkeyConfused } from '@/shared/ui/monkey-confused'

/** 404 global: macaco confuso, mensagem clara, endereço tentado e duas saídas. */
export function NotFoundPage() {
  const router = useRouter()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const headingRef = useRef<HTMLHeadingElement>(null)

  // SPA: ao cair na 404, título da aba e foco no h1 para leitores de tela anunciarem a mudança.
  useEffect(() => {
    const previous = document.title
    document.title = 'Página não encontrada — KURIO'
    headingRef.current?.focus()
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[1200px] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <MonkeyConfused className="max-w-[220px] md:max-w-[260px]" />
      <p className="text-5xl font-bold tracking-[0.2em] text-accent md:text-6xl" aria-label="Erro 404">
        404
      </p>
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none md:text-3xl">
        Ops, algo deu errado por aqui
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Não encontramos a página que você tentou acessar. Ela pode ter sido movida ou nunca ter existido.
      </p>
      <p className="max-w-full break-all rounded border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground">
        <span className="sr-only">Endereço acessado: </span>
        <code>{pathname}</code>
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3 max-md:w-full max-md:flex-col">
        <Button asChild size="lg" className="font-bold">
          <Link to="/">Voltar ao início</Link>
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            router.history.back()
          }}
        >
          Voltar à página anterior
        </Button>
      </div>
    </main>
  )
}
