import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { padEth } from '@/features/cart/format'
import { shortAddress } from '@/features/nft/editions'
import type { Order } from '@/shared/contracts'
import { ThankYouIllustration } from '@/shared/icons'
import { SkeletonImage } from '@/shared/ui/skeleton-image'

const EXPLORER_NAMES = { Ethereum: 'Etherscan', Polygon: 'Polygonscan', Solana: 'Solscan' } as const

/** "29 Jul, 2026" (como no Figma). */
function formatReceiptDate(iso: string): string {
  const date = new Date(iso)
  const day = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', timeZone: 'UTC' }).format(date)
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
    .format(date)
    .replace('.', '')
  const year = new Intl.DateTimeFormat('pt-BR', { year: 'numeric', timeZone: 'UTC' }).format(date)
  return `${day} ${month.charAt(0).toUpperCase()}${month.slice(1)}, ${year}`
}

/** "0xA91F…E82C" */
function shortTx(txRef: string): string {
  return `${txRef.slice(0, 6)}…${txRef.slice(-4)}`.toUpperCase().replace('0X', '0x')
}

/**
 * Recibo de um pedido CONFIRMADO. Reproduz o snapshot gravado no pedido: mudanças posteriores no
 * catálogo (preço, estoque, nome) nunca alteram estes valores.
 */
export function Receipt({ order }: { order: Order }) {
  const { snapshot } = order
  const explorer = EXPLORER_NAMES[order.network]

  return (
    <article
      aria-labelledby="receipt-title"
      className="relative mx-auto w-full max-w-[578px] border-b-8 border-accent bg-surface pb-10 md:border-b-[10px] md:pb-12"
    >
      <Link
        to="/"
        aria-label="Fechar"
        className="absolute right-4 top-4 text-accent md:right-[13px] md:top-[15px]"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </Link>

      <header className="grid justify-items-center gap-3 border-b border-accent/60 px-6 pb-5 pt-8 text-accent md:pb-[18px] md:pt-[22px]">
        <ThankYouIllustration width={66} height={80} />
        <h1
          id="receipt-title"
          className="text-center text-sm font-bold text-accent-strong md:text-base"
        >
          Seus NFTs agora estão na sua carteira
        </h1>
      </header>

      <dl className="grid grid-cols-2 gap-y-3 border-b border-accent/60 px-6 py-4 text-xs sm:grid-cols-4 sm:divide-x sm:divide-accent/60 md:flex md:px-9 md:py-[13px] md:text-sm">
        <div className="sm:pr-4 md:pr-[18px]">
          <dt className="font-bold">ID da transação</dt>
          <dd className="text-muted-foreground" title={order.txRef}>
            {order.txRef ? shortTx(order.txRef) : '—'}
          </dd>
        </div>
        <div className="sm:px-4 md:px-[18px]">
          <dt className="text-muted-foreground">Data</dt>
          <dd>{formatReceiptDate(snapshot.placedAt)}</dd>
        </div>
        <div className="sm:px-4 md:px-[18px]">
          <dt className="text-muted-foreground">Total</dt>
          <dd>{snapshot.total} ETH</dd>
        </div>
        <div className="sm:pl-4 md:pl-[18px]">
          <dt className="font-bold">Carteira</dt>
          <dd className="text-muted-foreground">{snapshot.collector.walletType}</dd>
        </div>
      </dl>

      <section aria-labelledby="receipt-details" className="px-6 pt-6 md:px-11 md:pt-5">
        <h2 id="receipt-details" className="text-sm font-bold md:text-[15px]">
          Detalhes da transação
        </h2>

        <div className="mt-3 grid grid-cols-[1fr_auto] gap-x-3 border-b border-border pb-2 text-sm font-bold sm:grid-cols-[1fr_70px_90px] md:mt-1.5 md:grid-cols-[1fr_76px_110px] md:text-base">
          <span>NFTs</span>
          <span className="hidden text-center sm:block">Edições</span>
          <span className="text-right">Subtotal</span>
        </div>

        <ul className="mt-2 grid gap-2 md:mt-3 md:gap-3">
          {snapshot.items.map((item) => (
            <li
              key={`${item.nftId}-${item.editionType}`}
              className="grid grid-cols-[1fr_auto] items-center gap-x-3 sm:grid-cols-[1fr_70px_90px] md:grid-cols-[1fr_76px_110px]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <SkeletonImage
                  src={item.nftImage}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-16 rounded-lg object-cover md:h-[70px] md:w-[70px]"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold md:text-base">{item.nftName}</p>
                  <p className="text-xs text-muted-foreground md:text-sm">
                    ID do token: {item.tokenId} · {item.editionType}
                    <span className="sm:hidden"> · (x {item.quantity})</span>
                  </p>
                </div>
              </div>
              <span className="hidden text-center text-xs text-muted-foreground sm:block md:text-sm">
                (x {item.quantity})
              </span>
              <span className="text-right text-sm font-bold text-accent-strong md:text-lg">
                {padEth(item.subtotal)} ETH
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 md:mt-3 md:border-b md:border-border md:pb-2">
          <dl className="grid gap-2 text-sm md:ml-auto md:w-[321px] md:gap-1.5 md:text-base">
            {snapshot.coupon ? (
              <div className="flex justify-between">
                <dt>Cupom {snapshot.coupon}</dt>
                <dd>(-) {padEth(snapshot.discount)} ETH</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt>Taxa de rede</dt>
              <dd>{snapshot.networkFee} ETH</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-bold md:border-t-0 md:pt-0">
              <dt>Total</dt>
              <dd className="text-accent-strong md:text-lg" data-testid="receipt-total">
                {snapshot.total} ETH
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground md:mt-3 md:text-sm md:leading-[22px]">
          Transação confirmada na {order.network}. A propriedade foi transferida para sua carteira
          conectada ({snapshot.collector.walletNickname},{' '}
          {shortAddress(snapshot.collector.walletAddress)}) e registrada na rede.
        </p>

        {order.txExplorerUrl ? (
          <div className="mt-5 text-center">
            <a
              href={order.txExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center rounded bg-accent px-6 text-sm font-bold md:h-12 md:px-4 md:text-base text-on-accent transition-opacity hover:opacity-90"
            >
              Ver no {explorer}
            </a>
          </div>
        ) : null}
      </section>
    </article>
  )
}
