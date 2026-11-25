// Implementação concreta do MSW worker. Separada para evitar importação cíclica.
// Handlers de negócio serão adicionados a partir da Etapa 01.

import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export async function startMocks() {
  const worker = setupWorker(...handlers)
  await worker.start({ onUnhandledRequest: 'bypass' })
}
