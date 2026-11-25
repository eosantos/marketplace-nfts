import { expect, test, type Page } from '@playwright/test'
import { ALICE, buyNow, login, NFT_ID, resetApp, setScenario } from './helpers'

const total = (page: Page) => page.getByTestId('cart-total')
const couponInput = (page: Page) => page.getByLabel('Código promocional')

async function applyCoupon(page: Page, code: string): Promise<void> {
  await couponInput(page).fill(code)
  await page.getByRole('button', { name: 'Aplicar' }).click()
}

test.beforeEach(async ({ page }) => {
  await resetApp(page)
})

test.describe('carrinho logado', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await buyNow(page)
    await expect(total(page)).toBeVisible()
  })

  test('altera quantidade, recalcula o total e remove o item comprado', async ({ page }) => {
    // O carrinho de Alice já tem itens; o recém-adicionado é a última linha.
    const remove = page.getByRole('button', { name: /^Remover .* do carrinho$/ })
    const lines = await remove.count()
    const increase = page.getByRole('button', { name: /^Aumentar quantidade de / }).last()
    const decrease = page.getByRole('button', { name: /^Diminuir quantidade de / }).last()
    const quantity = page.getByRole('group', { name: /^Quantidade de / }).last().locator('output')
    await expect(quantity).toHaveText('1')

    const before = await total(page).textContent()
    await increase.click()
    await expect(quantity).toHaveText('2')
    await expect(total(page)).not.toHaveText(before ?? '')

    await decrease.click()
    await expect(quantity).toHaveText('1')
    await expect(total(page)).toHaveText(before ?? '')

    await remove.last().click()
    await expect(remove).toHaveCount(lines - 1)
  })

  test('no limite de estoque o "+" explica o motivo', async ({ page }) => {
    // O carrinho seeded tem linhas (ex.: edição 1/1) sem estoque para mais de uma unidade.
    const increase = page.locator('button[aria-disabled="true"][aria-label^="Aumentar quantidade"]').first()
    await expect(increase).toBeVisible()
    // aria-disabled conta como "não habilitado" para o Playwright; o clique é intencional (anuncia o motivo).
    await increase.click({ force: true })
    await expect(page.getByText(/Máximo de \d+ unidades? por compra nesta edição/).first()).toBeVisible()
  })

  test('cupom válido aplica e remove; inválido e expirado mostram o motivo', async ({ page }) => {
    const base = await total(page).textContent()
    await applyCoupon(page, 'KURIO10')
    await expect(page.getByText('Cupom KURIO10 aplicado')).toBeVisible()
    await expect(total(page)).not.toHaveText(base ?? '')
    await page.getByRole('button', { name: 'Remover', exact: true }).click()
    await expect(total(page)).toHaveText(base ?? '')

    await applyCoupon(page, 'NOPE')
    await expect(page.locator('#coupon-error')).toBeVisible()

    await setScenario(page, 'coupon-expired')
    await applyCoupon(page, 'KURIO10')
    await expect(page.locator('#coupon-error')).toBeVisible()
  })

  test('cupom aplicado e carrinho sobrevivem ao refresh', async ({ page }) => {
    await applyCoupon(page, 'KURIO10')
    await expect(page.getByText('Cupom KURIO10 aplicado')).toBeVisible()
    await page.reload()
    await expect(page.getByText('Cupom KURIO10 aplicado')).toBeVisible()
    await expect(total(page)).toBeVisible()
  })

  test('itens persistem após navegar para fora e recarregar', async ({ page }) => {
    await page.goto('/')
    await page.goto('/cart')
    await expect(total(page)).toBeVisible()
    await page.waitForLoadState('networkidle')
    await page.reload()
    await expect(total(page)).toBeVisible()
  })
})

test('carrinho de visitante é mesclado à conta no login', async ({ page }) => {
  await buyNow(page, NFT_ID)
  await expect(page.getByRole('button', { name: /^Remover .* do carrinho$/ }).filter({ visible: true }).first()).toBeVisible()
  await login(page, ALICE, '/cart')
  await expect(page).toHaveURL(/\/cart/)
  await expect(page.getByRole('button', { name: /^Remover .* do carrinho$/ }).filter({ visible: true }).first()).toBeVisible()
  await expect(total(page)).toBeVisible()
})
