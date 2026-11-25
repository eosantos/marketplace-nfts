// MSW browser setup — inicializado em main.tsx quando VITE_ENABLE_MOCKS !== 'false'.
// Handlers de negócio serão adicionados a partir da Etapa 01.

import { startMocks as start } from './browser-impl'

export async function startMocks() {
  await start()
}
