import { Minus, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface StepperProps {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  /** Chamado ao tentar passar do máximo (para explicar o limite ao usuário). */
  onLimit?: () => void
  /** Nome do item, usado nos rótulos acessíveis. */
  label: string
  className?: string
}

const buttonClass =
  'flex h-6 w-6 items-center justify-center rounded-full bg-accent text-on-accent transition-opacity disabled:opacity-40'

/** Controle de quantidade: o "+" no limite continua clicável (aria-disabled) para anunciar o motivo. */
export function Stepper({ value, min = 1, max, onChange, onLimit, label, className }: StepperProps) {
  const atMax = value >= max

  return (
    <div role="group" aria-label={`Quantidade de ${label}`} className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        aria-label={`Diminuir quantidade de ${label}`}
        disabled={value <= min}
        onClick={() => {
          onChange(value - 1)
        }}
        className={buttonClass}
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <output aria-live="polite" className="w-5 text-center text-sm">
        {value}
      </output>
      <button
        type="button"
        aria-label={`Aumentar quantidade de ${label}`}
        aria-disabled={atMax}
        onClick={() => {
          if (atMax) onLimit?.()
          else onChange(value + 1)
        }}
        className={cn(buttonClass, atMax && 'opacity-60')}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
