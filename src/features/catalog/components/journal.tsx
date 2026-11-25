import { Skeleton } from '@/shared/ui/skeleton'
import { useArticles } from '../hooks'
import { SkeletonImage } from '@/shared/ui/skeleton-image'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' })

/** Artigos vêm da API (GET /articles). "Ler mais" está fora do escopo e não simula navegação. */
export function Journal() {
  const { data: articles, isPending, isError } = useArticles()

  return (
    <section aria-labelledby="journal-title" className="mt-20">
      <h2 id="journal-title" className="text-center text-2xl font-bold lg:text-[28px]">
        Diário da Cunhagem
      </h2>
      <p className="mt-2 text-center text-xs text-muted-foreground lg:text-sm">
        Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
      </p>

      {isError ? (
        <p role="alert" className="mt-8 text-center text-sm text-danger">
          Não foi possível carregar os artigos.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-[repeat(4,268px)] lg:gap-6">
          {isPending
            ? Array.from({ length: 4 }, (_, index) => (
                <li key={index}>
                  <Skeleton className="h-[290px] w-full rounded-none" />
                </li>
              ))
            : articles.map((article) => (
                <li key={article.id}>
                  <article className="h-full overflow-hidden rounded-lg bg-surface">
                    <SkeletonImage
                      src={article.image}
                      alt=""
                      width={240}
                      height={140}
                      loading="lazy"
                      decoding="async"
                      className="h-[140px] w-full object-cover object-top md:h-[195px] md:object-[center_25%]"
                    />
                    <div className="p-4">
                      <p className="text-[10px] text-muted-foreground lg:text-xs">
                        {dateFormat.format(new Date(article.publishedAt))} | Leitura de{' '}
                        {article.readMinutes} min
                      </p>
                      <h3 className="mt-2 text-sm font-bold lg:text-base">{article.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{article.excerpt}</p>
                      <span
                        aria-disabled="true"
                        title="Em breve"
                        className="mt-3 inline-block cursor-not-allowed text-[11px] text-accent lg:text-xs lg:font-bold"
                      >
                        Ler mais →
                      </span>
                    </div>
                  </article>
                </li>
              ))}
        </ul>
      )}
    </section>
  )
}
