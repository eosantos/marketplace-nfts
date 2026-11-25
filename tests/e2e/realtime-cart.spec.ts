import { expect, test, type Page } from '@playwright/test'
import { buyNow, confirmPurchase, goToReview, login, NFT_ID, resetApp } from './helpers'

async function waitSocket(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => window.__mocks?.socketState().connected)).toBe(1)
}

async function emitPrice(page: Page, price: string): Promise<void> {
  await page.evaluate(([nftId, value]) => window.__mocks?.emitNft({ nftId: nftId!, price: value! }), [NFT_ID, price])
}

test.beforeEach(async ({ page }) => {
  await resetApp(page)
  await login(page)
})

test('evento de socket com o item no carrinho avisa e atualiza o resumo', async ({ page }) => {
  await buyNow(page)
  await waitSocket(page)
  const before = await page.getByTestId('cart-total').textContent()

  await emitPrice(page, '9.99')

  await expect(page.locator('li[role="status"]').filter({ hasText: /o preço mudou de .* para 9\.99 ETH/ })).toBeVisible()
  await expect(page.getByTestId('cart-total')).not.toHaveText(before ?? '')
})

test('o aviso pode ser dispensado', async ({ page }) => {
  await buyNow(page)
  await waitSocket(page)
  await emitPrice(page, '8.88')
  const alert = page.locator('li[role="status"]').filter({ hasText: /o preço mudou/ })
  await expect(alert).toBeVisible()
  await alert.getByRole('button', { name: 'Dispensar aviso' }).click()
  await expect(alert).toHaveCount(0)
})

test('mudança durante a revisão bloqueia a confirmação até aceitar os novos valores', async ({ page }) => {
  await buyNow(page)
  await goToReview(page)
  await waitSocket(page)
  const confirm = page.getByRole('button', { name: 'Confirmar compra' })
  await expect(confirm).toBeEnabled()

  await emitPrice(page, '9.99')

  await expect(page.getByRole('heading', { name: 'Os valores mudaram enquanto você revisava' })).toBeVisible()
  await expect(confirm).toBeDisabled()

  await page.getByRole('button', { name: 'Aceitar novos valores e confirmar' }).click()
  await expect(confirm).toBeEnabled()
  await confirmPurchase(page)
  await expect(page).toHaveURL(/\/order\/.+/)
})
