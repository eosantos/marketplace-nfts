import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

const ctaClass =
  'mt-4 inline-flex h-9 items-center gap-2 self-end rounded bg-accent px-4 text-xs font-bold text-on-accent transition-opacity hover:opacity-90'

/** Dois cards de chamada com atalhos reais para o catálogo filtrado. */
export function PromoCards() {
  return (
    <section aria-label="Atalhos" className="mt-16 grid gap-6 md:grid-cols-2">
      <article className="grid grid-cols-[170px_1fr] bg-surface">
        <img
          src="/assets/nfts/ape-green.png"
          alt=""
          width={200}
          height={175}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        <div className="flex flex-col justify-center p-5 text-right">
          <h2 className="text-base font-bold">Lançamentos gênesis de edição limitada</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Colecione edições escassas diretamente dos criadores antes da revelação pública.
          </p>
          <Link to="/" search={{ tab: 'novos' }} className={ctaClass}>
            Explorar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </article>

      <article className="grid grid-cols-[170px_1fr] bg-surface">
        <img
          src="/assets/nfts/gorilla-black.png"
          alt=""
          width={200}
          height={175}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        <div className="flex flex-col justify-center p-5 text-right">
          <h2 className="text-base font-bold">Arte digital selecionada e muito mais</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.
          </p>
          <Link to="/" search={{ category: 'Arte digital' }} className={ctaClass}>
            Explorar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </article>
    </section>
  )
}
