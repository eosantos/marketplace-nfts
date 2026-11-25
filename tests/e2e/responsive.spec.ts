import { expect, test } from '@playwright/test'
import { login, resetApp } from './helpers'

const WIDTHS = [390, 768, 1440] as const
const PUBLIC = ['/', '/nft/nft_002', '/login', '/signup', '/cart', '/rota-inexistente']
const PRIVATE = ['/profile', '/wallets', '/checkout']

// Só no projeto desktop: o teste já percorre as três larguras com setViewportSize.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Percorre as larguras sozinho.')
})

async function hasOverflow(page: import('@playwright/test').Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
}

for (const width of WIDTHS) {
  test(`sem rolagem horizontal em ${width}px (páginas públicas)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await resetApp(page)
    for (const path of PUBLIC) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      expect(await hasOverflow(page), `${path} em ${width}px`).toBe(false)
    }
  })

  test(`sem rolagem horizontal em ${width}px (páginas autenticadas)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await resetApp(page)
    await login(page)
    for (const path of PRIVATE) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      expect(await hasOverflow(page), `${path} em ${width}px`).toBe(false)
    }
  })
}
