import { expect, test } from '@playwright/test'
import { buyNow, login, NFT_ID, resetApp } from './helpers'

// Baselines em tests/e2e/__screenshots__ (gerar com `pnpm test:e2e:update`).
// Regressão visual das telas do Figma: início, detalhe, carrinho e pagamento (+ 404).
test.describe('regressão visual', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page)
  })

  test('início', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1').first()).toBeAttached()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('inicio.png', { fullPage: true })
  })

  test('detalhe do NFT', async ({ page }) => {
    await page.goto(`/nft/${NFT_ID}`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('detalhe.png')
  })

  test('carrinho', async ({ page }) => {
    await login(page)
    await buyNow(page)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('cart-total')).toBeVisible()
    await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true })
  })

  test('pagamento', async ({ page }) => {
    await login(page)
    await buyNow(page)
    await page.getByRole('link', { name: /finalizar/i }).click()
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.getByTestId('checkout-total')).toBeVisible()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true })
  })

  test('404', async ({ page }) => {
    await page.goto('/rota-inexistente')
    await expect(page.getByRole('heading', { name: 'Ops, algo deu errado por aqui' })).toBeVisible()
    await expect(page).toHaveScreenshot('404.png')
  })
})
