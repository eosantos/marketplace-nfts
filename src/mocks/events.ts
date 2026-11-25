// Barramento de eventos do banco simulado.
// Os serviços emitem aqui quando algo muda; o servidor Socket.IO simulado (Etapa 06)
// assina estes eventos e os entrega via socket.io-client. Nada aqui toca a UI.

import type { OrderStatus } from '@/shared/contracts'

export type MockDbEvent =
  | { type: 'order.updated'; orderId: string; userId: string; status: OrderStatus }
  | { type: 'nft.updated'; nftId: string }

type Listener = (event: MockDbEvent) => void

const listeners = new Set<Listener>()

export function onMockDbEvent(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitMockDbEvent(event: MockDbEvent): void {
  for (const listener of listeners) listener(event)
}
