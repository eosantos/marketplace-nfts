import { expect, test, type Page } from '@playwright/test'
import { buyNow, confirmPurchase, goToReview, login, resetApp, setScenario } from './helpers'

const RECEIPT = 'Seus NFTs agora estão na sua carteira'

async function ordersCount(page: Page): Promise<number> {
  return page.evaluate(() => window.__mocks?.getState().orders ?? -1)
}

test.beforeEach(async ({ page }) => {
  await resetApp(page)
  await login(page)
})

test('compra completa: detalhe → carrinho → pagamento → revisão → recibo', async ({ page }) => {
  const before = await ordersCount(page)
  await buyNow(page)
  await goToReview(page)
  await confirmPurchase(page)

  await expect(page).toHaveURL(/\/order\/.+/)
  await expect(page.getByRole('heading', { name: RECEIPT })).toBeVisible()
  await expect(page.getByTestId('receipt-total')).toContainText('ETH')
  expect(await ordersCount(page)).toBe(before + 1)

  // Só o comprado sai do carrinho: o carrinho fica vazio (era o único item).
  await page.goto('/cart')
  await expect(page.getByTestId('cart-total')).toHaveCount(0)
})

test('pagamento recusado: mostra a falha e preserva o carrinho', async ({ page }) => {
  await setScenario(page, 'payment-refused')
  await buyNow(page)
  await goToReview(page)
  await confirmPurchase(page)

  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  await page.goto('/cart')
  await expect(page.getByTestId('cart-total')).toBeVisible()
})

test('cliques repetidos em "Confirmar compra" geram um único pedido', async ({ page }) => {
  const before = await ordersCount(page)
  await buyNow(page)
  await goToReview(page)
  const confirm = page.getByRole('button', { name: 'Confirmar compra' })
  await confirm.dblclick()
  await confirm.click({ force: true, timeout: 1_000 }).catch(() => undefined)

  await expect(page).toHaveURL(/\/order\/.+/)
  await expect(page.getByRole('heading', { name: RECEIPT })).toBeVisible()
  expect(await ordersCount(page)).toBe(before + 1)
})

test('timeout após criar o pedido: recupera o mesmo pedido por idempotência', async ({ page }) => {
  test.setTimeout(90_000)
  const before = await ordersCount(page)
  await setScenario(page, 'timeout-after-order-created')
  await buyNow(page)
  await goToReview(page)
  await confirmPurchase(page)

  await expect(page).toHaveURL(/\/order\/.+/, { timeout: 60_000 })
  await expect(page.getByRole('heading', { name: RECEIPT })).toBeVisible({ timeout: 30_000 })
  expect(await ordersCount(page)).toBe(before + 1)
})

test('preço mudou no checkout: exige nova confirmação antes de comprar', async ({ page }) => {
  const before = await ordersCount(page)
  await setScenario(page, 'price-changed-at-checkout')
  await buyNow(page)
  await goToReview(page)
  await confirmPurchase(page)

  await expect(page.getByRole('button', { name: 'Aceitar novos valores e confirmar' })).toBeVisible()
  expect(await ordersCount(page)).toBe(before)
  await page.getByRole('button', { name: 'Aceitar novos valores e confirmar' }).click()
  await expect(page.getByRole('heading', { name: RECEIPT })).toBeVisible()
  expect(await ordersCount(page)).toBe(before + 1)
})

test('esgotado no checkout: bloqueia a compra', async ({ page }) => {
  const before = await ordersCount(page)
  await setScenario(page, 'sold-out-at-checkout')
  await buyNow(page)
  await goToReview(page)
  await confirmPurchase(page)

  await expect(page.getByRole('heading', { name: 'Não é possível confirmar a compra' })).toBeVisible()
  expect(await ordersCount(page)).toBe(before)
})

test('recarregar com pedido pendente retoma o mesmo pedido, sem nova compra', async ({ page }) => {
  const before = await ordersCount(page)
  await buyNow(page)
  await goToReview(page)
  await confirmPurchase(page)
  await expect(page).toHaveURL(/\/order\/.+/)

  await page.reload()
  await expect(page.getByRole('heading', { name: RECEIPT })).toBeVisible({ timeout: 20_000 })
  expect(await ordersCount(page)).toBe(before + 1)
})
