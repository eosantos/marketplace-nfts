import { defineConfig, devices } from '@playwright/test'

/**
 * E2E contra o app real com MSW (REST + Socket.IO simulados no navegador).
 * - desktop 1440x900 e mobile 390 (iPhone 14 = 390x844);
 * - cada teste reseta o banco simulado via `window.__mocks` (ver tests/e2e/helpers.ts);
 * - usa `vite preview` do build (mais próximo do deploy). Use `PW_DEV=1` para o servidor de dev.
 */
const PORT = 4173
const useDev = process.env['PW_DEV'] === '1'
const baseURL = useDev ? 'http://localhost:5173' : `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : 4,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled' },
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFileName}/{arg}{ext}',
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['iPhone 14'], browserName: 'chromium' },
    },
  ],
  webServer: {
    command: useDev ? 'pnpm dev' : `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
    env: { VITE_ENABLE_MOCKS: 'true', VITE_MOCK_SCENARIO: 'default' },
  },
})
