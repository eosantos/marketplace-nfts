// A barra mobile mostra o total sem zero à direita (3.5), o desktop com duas casas (3.50): o regex aceita os dois.
import { expect, test } from '@playwright/test'
import { login, NFT_ID, resetApp } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetApp(page)
  // O socket só conecta com sessão (autentica por evento).
  await login(page)
  await page.goto(`/nft/${NFT_ID}`)
  await expect.poll(() => page.evaluate(() => window.__mocks?.socketState().connected)).toBe(1)
})

test('evento nft.updated atualiza o preço sem recarregar', async ({ page }) => {
  await page.evaluate((nftId) => window.__mocks?.emitNft({ nftId, price: '3.50' }), NFT_ID)
  await expect(page.getByText(/(?<!\d)3[.,]50?(?!\d)/).filter({ visible: true }).first()).toBeVisible()
})

test('evento duplicado e evento antigo não regridem o preço', async ({ page }) => {
  await page.evaluate(
    (nftId) => window.__mocks?.emitNft({ nftId, price: '4.20', duplicate: true, stale: true }),
    NFT_ID,
  )
  await expect(page.getByText(/(?<!\d)4[.,]20?(?!\d)/).filter({ visible: true }).first()).toBeVisible()
  await page.waitForTimeout(500)
  await expect(page.getByText(/(?<!\d)4[.,]20?(?!\d)/).filter({ visible: true }).first()).toBeVisible()
})

test('queda do socket reconecta e volta a receber eventos', async ({ page }) => {
  await page.evaluate(() => window.__mocks?.dropSocket())
  await expect
    .poll(() => page.evaluate(() => window.__mocks?.socketState().connected), { timeout: 30_000 })
    .toBe(1)
  await page.evaluate((nftId) => window.__mocks?.emitNft({ nftId, price: '5.75' }), NFT_ID)
  await expect(page.getByText(/(?<!\d)5[.,]75(?!\d)/).filter({ visible: true }).first()).toBeVisible()
})
