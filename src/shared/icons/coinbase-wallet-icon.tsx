import type { SVGProps } from 'react'

// GENÉRICO: o ícone da Coinbase Wallet não foi exportado do Figma.
// Substitua o conteúdo por design/assets/icons/coinbase-wallet.svg quando existir.
export function CoinbaseWalletIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <circle cx="16" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}
