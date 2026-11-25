import { createFileRoute } from '@tanstack/react-router'
import { RoutePlaceholder } from '@/shared/ui/route-placeholder'

export const Route = createFileRoute('/nft/$nftId')({
  component: NftDetailPage,
})

function NftDetailPage() {
  const { nftId } = Route.useParams()
  return (
    <RoutePlaceholder
      title={`Detalhes do NFT ${nftId}`}
      screen="desktop-detalhe-nft.png e mobile-detalhe-nft.png"
      stage="04"
    />
  )
}
