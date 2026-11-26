import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { SkeletonImage } from '@/shared/ui/skeleton-image'

const ctaClass =
  'mt-4 inline-flex h-9 lg:mt-auto items-center gap-2 self-end rounded bg-accent px-4 text-xs font-bold lg:h-10 lg:px-5 lg:text-sm text-on-accent transition-opacity hover:opacity-90'

/** Dois cards de chamada com atalhos reais para o catálogo filtrado. */
export function PromoCards() {
  return (
    <section id="criadores" aria-label="Atalhos" className="mt-16 scroll-mt-6 grid gap-6 md:mt-24 md:grid-cols-2 lg:gap-[30px]">
      <article data-skel-group className="grid grid-cols-[170px_1fr] overflow-hidden rounded-lg bg-surface lg:min-h-[250px] lg:grid-cols-[287px_1fr]">
        <SkeletonImage
          src="/assets/nfts/ape-green.webp"
          alt=""
          width={200}
          height={175}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        <div className="flex flex-col items-end justify-center p-5 text-right lg:justify-start lg:px-[30px] lg:py-6">
          <h2 className="skel-text text-base font-bold lg:text-lg lg:leading-6">Lançamentos gênesis de edição limitada</h2>
          <p className="skel-text mt-2 text-xs text-muted-foreground lg:mb-5 lg:mt-3 lg:text-sm lg:leading-6">
            Colecione edições escassas diretamente dos criadores antes da revelação pública.
          </p>
          <Link to="/" search={{ tab: 'novos' }} className={ctaClass}>
            Explorar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </article>

      <article data-skel-group className="grid grid-cols-[170px_1fr] overflow-hidden rounded-lg bg-surface lg:min-h-[250px] lg:grid-cols-[287px_1fr]">
        <SkeletonImage
          src="/assets/nfts/gorilla-black.webp"
          alt=""
          width={200}
          height={175}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        <div className="flex flex-col items-end justify-center p-5 text-right lg:justify-start lg:px-[30px] lg:py-6">
          <h2 className="skel-text text-base font-bold lg:text-lg lg:leading-6">Arte digital selecionada e muito mais</h2>
          <p className="skel-text mt-2 text-xs text-muted-foreground lg:mb-5 lg:mt-3 lg:text-sm lg:leading-6">
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
