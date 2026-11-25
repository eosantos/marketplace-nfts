import { expect, test } from '@playwright/test'
import { resetApp } from './helpers'

test('app carrega com os mocks ativos e o controle window.__mocks', async ({ page }) => {
  await resetApp(page)
  await expect(page.locator('h1').first()).toBeAttached()
  const state = await page.evaluate(() => window.__mocks?.getState())
  expect(state?.scenario).toBe('default')
  expect(state?.nfts).toBe(64)
})
