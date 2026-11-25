import { Link } from '@tanstack/react-router'
import { Linkedin, Mail, Twitter } from 'lucide-react'
import { parseApiError } from '@/shared/api/errors'
import type { Nft } from '@/shared/contracts'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { useNft } from '../hooks'
import { useNftPurchase } from '../use-nft-purchase'
import { DetailTabs } from './detail-tabs'
import { Gallery } from './gallery'
import { DesktopPurchaseRow, EditionPicker, MobilePurchaseBar } from './purchase-controls'
import { RelatedNfts } from './related-nfts'
import { StarRating } from './star-rating'

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Carregando NFT" className="grid gap-6 md:grid-cols-[100px_minmax(0,1fr)] md:gap-7 lg:grid-cols-[100px_444px_minmax(0,1fr)]">
      <div className="hidden flex-col gap-4 md:flex">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="aspect-square w-full" />
        ))}
      </div>
      <Skeleton className="aspect-square w-full md:h-[444px]" />
      <div className="grid content-start gap-4 md:col-span-2 lg:col-span-1">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </div>
      {/* Reserva a altura de abas e relacionados: o rodapé não pula quando o conteúdo chega (CLS). */}
      <div className="hidden gap-6 md:col-span-2 lg:col-span-3 md:mt-8 md:grid">
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-[360px] w-full" />
      </div>
    </div>
  )
}

function NotFoundState() {
  return (
    <div className="grid justify-items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-bold">NFT não encontrado</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Este NFT não existe ou foi removido. Veja outras obras no catálogo.
      </p>
      <Button asChild>
        <Link to="/">Voltar ao catálogo</Link>
      </Button>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="grid justify-items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Não foi possível carregar este NFT</h1>
      <p className="max-w-md text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
      <Button onClick={onRetry}>Tentar novamente</Button>
    </div>
  )
}

function ShareLinks({ nft }: { nft: Nft }) {
  const url = window.location.href
  const linkClass = 'text-foreground transition-colors hover:text-accent'

  return (
    <p className="mt-6 hidden items-center gap-3 text-sm font-bold md:flex">
      Compartilhar este NFT:
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no LinkedIn"
        className={linkClass}
      >
        <Linkedin className="h-4 w-4" aria-hidden="true" />
      </a>
      <a
        href={`mailto:?subject=${encodeURIComponent(nft.name)}&body=${encodeURIComponent(url)}`}
        aria-label="Compartilhar por e-mail"
        className={linkClass}
      >
        <Mail className="h-4 w-4" aria-hidden="true" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(nft.name)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no Twitter"
        className={linkClass}
      >
        <Twitter className="h-4 w-4" aria-hidden="true" />
      </a>
    </p>
  )
}

function NftDetailContent({ nft }: { nft: Nft }) {
  const purchase = useNftPurchase(nft)

  return (
    <>
      <div className="grid gap-6 md:grid-cols-[100px_minmax(0,1fr)] md:gap-7 lg:grid-cols-[100px_444px_minmax(0,1fr)]">
        <Gallery nft={nft} />

        <div className="min-w-0 md:col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold md:text-[28px]">{nft.name}</h1>
            <p role="img" className="flex items-center gap-1 rounded-full border border-accent px-3 py-1 text-xs md:hidden" aria-label={`Nota ${nft.rating.score.toFixed(1)} de 5, ${nft.rating.count} avaliações`}>
              <span aria-hidden="true">★ {nft.rating.score.toFixed(1)} ({nft.rating.count})</span>
            </p>
          </div>

          <div className="mt-2 hidden items-center justify-between gap-4 border-b border-border pb-3 md:flex">
            <p className="text-2xl font-bold text-accent-strong">{nft.price} ETH</p>
            <StarRating rating={nft.rating} />
          </div>

          <h2 className="mt-4 hidden text-sm font-bold md:block">Sobre este NFT:</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground md:mt-1 md:line-clamp-none">
            {nft.description}
          </p>

          <div className="mt-5">
            <EditionPicker nft={nft} purchase={purchase} />
          </div>

          <DesktopPurchaseRow nft={nft} purchase={purchase} />

          <dl className="mt-6 grid gap-2 text-sm text-muted-foreground">
            <div>
              <dt className="inline">ID do token: </dt>
              <dd className="inline">{nft.tokenId}</dd>
            </div>
            <div>
              <dt className="inline">Coleção: </dt>
              <dd className="inline">{nft.collection}</dd>
            </div>
            <div>
              <dt className="inline">Atributos: </dt>
              <dd className="inline">{nft.attributes.map((attribute) => attribute.value).join(', ')}</dd>
            </div>
          </dl>

          <ShareLinks nft={nft} />
        </div>
      </div>

      <DetailTabs nft={nft} />
      <RelatedNfts nft={nft} />
      <MobilePurchaseBar nft={nft} purchase={purchase} />
    </>
  )
}

/** Detalhe do NFT: carregando, não encontrado (404), erro com retry e conteúdo. */
export function NftDetail({ nftId }: { nftId: string }) {
  const query = useNft(nftId)

  if (query.isPending) return <DetailSkeleton />

  if (!query.data) {
    return parseApiError(query.error).code === 'NOT_FOUND' ? (
      <NotFoundState />
    ) : (
      <ErrorState
        onRetry={() => {
          void query.refetch()
        }}
      />
    )
  }

  // key: trocar de NFT (links de "Mais desta coleção") reinicia edição e quantidade.
  return <NftDetailContent key={query.data.id} nft={query.data} />
}
