// Entrada mínima: baixa em paralelo o app e (se ligados) os mocks, em vez de em sequência.
// A renderização só começa depois que o MSW inicia: o primeiro request já precisa ser interceptado.
async function bootstrap() {
  // Mocks ligados por padrão (dev e demonstração); desligue com VITE_ENABLE_MOCKS=false.
  const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS !== 'false'
  const [mocks, app] = await Promise.all([
    mocksEnabled ? import('../mocks/browser') : Promise.resolve(null),
    import('./app'),
  ])
  if (mocks) await mocks.startMocks()
  app.renderApp()
}

void bootstrap()
