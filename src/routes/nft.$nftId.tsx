import { createFileRoute, Link } from '@tanstack/react-router'
import { NftDetail } from '@/features/nft/components/nft-detail'
import { SiteFooter } from '@/shared/layout/site-footer'

export const Route = createFileRoute('/nft/$nftId')({
  component: NftDetailPage,
})

function NftDetailPage() {
  const { nftId } = Route.useParams()

  return (
    <>
      <main className="mx-auto max-w-[1200px] px-5 pb-48 md:px-0 md:pb-0">
        <nav aria-label="Trilha" className="hidden py-6 text-xs font-bold md:block lg:pb-5 lg:pt-8 lg:text-[15px]">
          <Link to="/" className="hover:text-accent">
            Início
          </Link>{' '}
          / <span aria-hidden="true">Mercado</span>
        </nav>
        <NftDetail nftId={nftId} />
      </main>
      <SiteFooter />
    </>
  )
}
