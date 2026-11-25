import { useRealtimeStatus } from '@/features/realtime/hooks'
import { cn } from '@/shared/lib/utils'

const LABELS = {
  connecting: 'Conectando ao tempo real',
  connected: 'Tempo real conectado',
  reconnecting: 'Reconectando ao tempo real',
} as const

/** Indicador discreto do estado da conexão (visível só com sessão ativa). */
export function RealtimeStatusDot() {
  const status = useRealtimeStatus()
  if (status === 'disconnected') return null

  return (
    <span role="img" aria-label={LABELS[status]} title={LABELS[status]} className="flex items-center">
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          status === 'connected' ? 'bg-accent' : 'animate-pulse bg-danger motion-reduce:animate-none',
        )}
      />
    </span>
  )
}
