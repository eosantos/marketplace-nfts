// MSW browser setup — to be expanded in Step 01 (mocks)
// Placeholder so the app bootstraps without errors when VITE_ENABLE_MOCKS=true

export async function startMocks() {
  const { setupWorker } = await import('msw/browser')
  const worker = setupWorker()
  await worker.start({ onUnhandledRequest: 'bypass' })
}
