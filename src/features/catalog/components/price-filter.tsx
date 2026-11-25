import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import {
  centsToEth,
  ethToCents,
  formatEthPt,
  PRICE_MAX_CENTS,
  PRICE_MIN_CENTS,
} from '../search'

interface PriceFilterProps {
  minPrice: string | undefined
  maxPrice: string | undefined
  onApply: (range: { minPrice: string | undefined; maxPrice: string | undefined }) => void
}

const percent = (cents: number) => ((cents - PRICE_MIN_CENTS) / (PRICE_MAX_CENTS - PRICE_MIN_CENTS)) * 100

/**
 * Faixa de preço com dois sliders nativos sobrepostos (teclado e leitor de tela de graça).
 * Trabalha em centésimos de ETH inteiros; os valores aplicados voltam como string decimal.
 * Use `key` para reiniciar quando a URL mudar.
 */
export function PriceFilter({ minPrice, maxPrice, onApply }: PriceFilterProps) {
  const [low, setLow] = useState(minPrice ? ethToCents(minPrice) : PRICE_MIN_CENTS)
  const [high, setHigh] = useState(maxPrice ? ethToCents(maxPrice) : PRICE_MAX_CENTS)

  return (
    <div>
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-border" />
        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-accent"
          style={{ left: `${percent(low)}%`, right: `${100 - percent(high)}%` }}
        />
        <input
          type="range"
          aria-label="Preço mínimo"
          aria-valuetext={`${centsToEth(low)} ETH`}
          min={PRICE_MIN_CENTS}
          max={PRICE_MAX_CENTS}
          value={low}
          onChange={(event) => {
            setLow(Math.min(Number(event.target.value), high - 1))
          }}
          className="range-input absolute inset-0 h-full w-full"
        />
        <input
          type="range"
          aria-label="Preço máximo"
          aria-valuetext={`${centsToEth(high)} ETH`}
          min={PRICE_MIN_CENTS}
          max={PRICE_MAX_CENTS}
          value={high}
          onChange={(event) => {
            setHigh(Math.max(Number(event.target.value), low + 1))
          }}
          className="range-input absolute inset-0 h-full w-full"
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
        Preço: {formatEthPt(centsToEth(low))} - {formatEthPt(centsToEth(high))} ETH
      </p>

      <Button
        size="sm"
        className="mt-3 h-8 rounded px-4 text-xs font-bold"
        onClick={() => {
          onApply({
            minPrice: low === PRICE_MIN_CENTS ? undefined : centsToEth(low),
            maxPrice: high === PRICE_MAX_CENTS ? undefined : centsToEth(high),
          })
        }}
      >
        Aplicar
      </Button>
    </div>
  )
}
