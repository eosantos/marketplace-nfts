import { setupWorker } from 'msw/browser'
import { installWindowControl, resetMocks } from './control'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

const ENV_SCENARIO_KEY = 'kurio:mocks:env-scenario'

/**
 * Aplica VITE_MOCK_SCENARIO só quando o valor do env muda (primeira execução ou troca no .env).
 * Assim um cenário escolhido por window.__mocks sobrevive ao refresh.
 */
function applyEnvScenario(): void {
  const envScenario = import.meta.env.VITE_MOCK_SCENARIO
  if (!envScenario) return

  try {
    if (window.localStorage.getItem(ENV_SCENARIO_KEY) !== envScenario) {
      resetMocks(envScenario)
      window.localStorage.setItem(ENV_SCENARIO_KEY, envScenario)
    }
  } catch {
    // localStorage indisponível: segue com o estado em memória.
  }
}

export async function startMocks() {
  applyEnvScenario()
  installWindowControl()
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
}
