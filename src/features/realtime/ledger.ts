import type { SocketEvent } from '@/shared/contracts'

/**
 * Decide se um evento deve ser aplicado. Ignora (1) duplicatas, pelo `id` (com descarte dos mais
 * antigos para não crescer sem limite) e (2) eventos antigos, cuja `version` não passa da última
 * já aplicada para aquele recurso.
 */
export class EventLedger {
  private readonly seen = new Set<string>()
  private readonly versions = new Map<string, number>()

  constructor(private readonly capacity = 500) {}

  accept(event: SocketEvent): boolean {
    if (this.seen.has(event.id)) return false
    this.remember(event.id)

    const key = `${event.resource}:${event.resourceId}`
    if (event.version <= (this.versions.get(key) ?? 0)) return false

    this.versions.set(key, event.version)
    return true
  }

  reset(): void {
    this.seen.clear()
    this.versions.clear()
  }

  private remember(id: string): void {
    this.seen.add(id)
    if (this.seen.size > this.capacity) {
      const oldest = this.seen.values().next().value
      if (oldest !== undefined) this.seen.delete(oldest)
    }
  }
}
