import { useAnnouncement } from '@/features/realtime/announcer'

/** Região aria-live (invisível) que anuncia mudanças em tempo real: preço, estoque e pedido. */
export function RealtimeAnnouncer() {
  const message = useAnnouncement()
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  )
}
