import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { buyNow, login, NFT_ID, resetApp } from './helpers'

// Acessibilidade automatizada (axe-core): nenhuma violação crítica ou séria nas telas principais.
async function expectNoSevereViolations(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze()
  const severe = violations.filter((item) => item.impact === 'critical' || item.impact === 'serious')
  expect(
    severe.map((item) => `${item.id}: ${item.nodes.map((node) => node.target.join(' ')).join(' | ')}`),
  ).toEqual([])
}

test.beforeEach(async ({ page }) => {
  await resetApp(page)
})

test('público: início, detalhe do NFT, login e 404', async ({ page }) => {
  for (const path of ['/', `/nft/${NFT_ID}`, '/login', '/rota-inexistente']) {
    await page.goto(path)
    await expectNoSevereViolations(page)
  }
})

test('autenticado: carrinho, pagamento, perfil e carteiras', async ({ page }) => {
  await login(page)
  await buyNow(page)
  await expectNoSevereViolations(page)
  await page.getByRole('link', { name: /finalizar/i }).click()
  await expect(page.getByTestId('checkout-total')).toBeVisible()
  await expectNoSevereViolations(page)
  for (const path of ['/profile', '/wallets']) {
    await page.goto(path)
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoSevereViolations(page)
  }
})
