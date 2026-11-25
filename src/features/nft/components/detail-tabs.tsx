import { useState } from 'react'
import type { Nft } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'
import { shortAddress } from '../editions'

type TabId = 'details' | 'reviews'

function Block({ label, children }: { label: string; children: string }) {
  return (
    <div className="mt-5">
      <h3 className="text-sm font-bold">{label}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  )
}

/** Abas "Detalhes do NFT" e "Avaliações de colecionadores". As avaliações individuais estão fora do escopo. */
export function DetailTabs({ nft }: { nft: Nft }) {
  const [tab, setTab] = useState<TabId>('details')

  const tabClass = (id: TabId) =>
    cn(
      'border-b-2 pb-2 text-sm transition-colors lg:text-[17px]',
      tab === id ? 'border-accent font-bold text-accent' : 'border-transparent hover:text-accent',
    )

  return (
    <section aria-label="Informações do NFT" className="mt-16 hidden md:block lg:mt-[88px]">
      <div role="tablist" aria-label="Seções do NFT" className="flex gap-8 border-b border-border lg:gap-10">
        <button type="button" role="tab" id="tab-details" aria-selected={tab === 'details'} aria-controls="panel-details" className={tabClass('details')} onClick={() => { setTab('details') }}>
          Detalhes do NFT
        </button>
        <button type="button" role="tab" id="tab-reviews" aria-selected={tab === 'reviews'} aria-controls="panel-reviews" className={tabClass('reviews')} onClick={() => { setTab('reviews') }}>
          Avaliações de colecionadores ({nft.rating.count})
        </button>
      </div>

      {tab === 'details' ? (
        <div role="tabpanel" id="panel-details" aria-labelledby="tab-details" className="pt-6">
          <p className="max-w-4xl text-sm leading-6 text-muted-foreground">{nft.description}</p>
          <Block label="Rede:">{`Cunhado na ${nft.network} com procedência imutável e metadados armazenados no IPFS.`}</Block>
          <Block label="Contrato:">{`${shortAddress(nft.contract)} • Contrato inteligente ERC-721 verificado.`}</Block>
          <Block label="Direitos autorais:">{`Direitos autorais do criador: ${nft.royalties}% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.`}</Block>
        </div>
      ) : (
        <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews" className="pt-6">
          <p className="text-sm text-muted-foreground">
            Nota média de {nft.rating.score.toFixed(1)} em {nft.rating.count} avaliações. Os comentários
            individuais ficam disponíveis em breve.
          </p>
        </div>
      )}
    </section>
  )
}
