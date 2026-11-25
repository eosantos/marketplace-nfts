import { expect, test, type Page } from '@playwright/test'
import { resetApp, setScenario } from './helpers'

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768

async function total(page: Page): Promise<number> {
  const status = page.getByText(/^\d+ NFTs encontrados$/)
  await expect(status).toBeAttached()
  return Number((await status.textContent())?.match(/\d+/)?.[0])
}

/** Um título (h3) por card: existe no desktop e no mobile (o link "Ver detalhes" é só do desktop). */
function cards(page: Page) {
  return page.locator('main article h3')
}

test.describe('catálogo', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page)
    await page.goto('/')
  })

  test('lista, pagina e restaura a página pelo histórico', async ({ page }) => {
    await expect(cards(page).first()).toBeVisible()
    const all = await total(page)
    expect(all).toBeGreaterThan(12)

    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')

    await page.goBack()
    await expect(page).not.toHaveURL(/page=2/)
    await expect(page.getByRole('link', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
    await page.goForward()
    await expect(page).toHaveURL(/page=2/)
  })

  test('busca por nome, estado vazio e limpeza', async ({ page }) => {
    await expect(cards(page).first()).toBeVisible()
    const name = ((await cards(page).first().textContent()) ?? '').trim()
    const term = name.split(' ')[0] ?? name

    if (!isMobile(page)) await page.getByRole('button', { name: 'Abrir busca' }).click()
    const input = page.getByRole('searchbox', { name: 'Buscar NFTs' }).filter({ visible: true }).first()
    await input.fill(term)
    await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(term)}`))
    await expect(page.getByText(name).filter({ visible: true }).first()).toBeVisible()

    await input.fill('zzzz-inexistente')
    await expect(page.getByText('Nenhum NFT encontrado.')).toBeVisible()
    await page.getByRole('button', { name: 'Limpar filtros' }).click()
    await expect(page).not.toHaveURL(/q=/)
    await expect(cards(page).first()).toBeVisible()
  })

  test('filtros combinados e ordenação por preço persistem na URL', async ({ page }) => {
    test.skip(isMobile(page), 'A barra lateral de filtros é do desktop; o mobile usa a mesma URL (coberto abaixo).')
    const all = await total(page)

    await page.getByRole('button', { name: /^Arte digital/ }).click()
    await expect(page).toHaveURL(/category=Arte\+digital|category=Arte%20digital/)
    await expect.poll(() => total(page)).toBeLessThan(all)

    await page.getByRole('button', { name: /^Ethereum/ }).click()
    await expect(page).toHaveURL(/network=Ethereum/)
    await expect(page.getByRole('button', { name: /^Arte digital/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: /^Ethereum/ })).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('combobox', { name: /Ordenar por/ }).click()
    await page.getByRole('option', { name: 'Menor preço' }).click()
    await expect(page).toHaveURL(/orderBy=preco-asc/)

    // Recarregar mantém tudo (estado na URL).
    await page.reload()
    await expect(page.getByRole('button', { name: /^Arte digital/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('combobox', { name: /Ordenar por/ })).toContainText('Menor preço')

    // Desmarcar um filtro amplia o resultado.
    const narrow = await total(page)
    await page.getByRole('button', { name: /^Ethereum/ }).click()
    await expect(page).not.toHaveURL(/network=/)
    await expect.poll(() => total(page)).toBeGreaterThanOrEqual(narrow)
  })

  test('URL com filtros, ordenação e página abre o estado correspondente (desktop e mobile)', async ({ page }) => {
    await page.goto('/?category=Fotografia&orderBy=preco-desc')
    await expect(cards(page).first()).toBeVisible()
    const filtered = await total(page)
    await page.goto('/')
    await expect(cards(page).first()).toBeVisible()
    expect(filtered).toBeLessThan(await total(page))
  })

  test('acesso direto ao detalhe e a um NFT inexistente', async ({ page }) => {
    await page.goto('/nft/nft_002')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toHaveCount(0)

    await page.goto('/nft/nft_inexistente')
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
  })
})

test.describe('carregamento e falhas do catálogo', () => {
  test('latência alta mostra skeleton e depois o conteúdo', async ({ page }) => {
    await resetApp(page)
    await setScenario(page, 'slow-random-latency')
    await page.goto('/')
    await expect(page.getByRole('status', { name: 'Carregando NFTs' })).toBeVisible()
    await expect(cards(page).first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('status', { name: 'Carregando NFTs' })).toHaveCount(0)
  })

  for (const scenario of ['network-failure', 'http-5xx'] as const) {
    test(`falha (${scenario}) mostra erro e "Tentar novamente" recupera`, async ({ page }) => {
      await resetApp(page)
      await setScenario(page, scenario)
      await page.goto('/')
      const retry = page.getByRole('button', { name: 'Tentar novamente' }).first()
      await expect(page.getByText('Não foi possível carregar os NFTs.')).toBeVisible({ timeout: 30_000 })
      await setScenario(page, 'default')
      await retry.click()
      await expect(cards(page).first()).toBeVisible()
      await expect(page.getByText('Não foi possível carregar os NFTs.')).toHaveCount(0)
    })
  }

  test('detalhe com falha de rede mostra erro e recupera', async ({ page }) => {
    await resetApp(page)
    await setScenario(page, 'network-failure')
    await page.goto('/nft/nft_002')
    await expect(page.getByRole('heading', { name: 'Não foi possível carregar este NFT' })).toBeVisible({ timeout: 30_000 })
    await setScenario(page, 'default')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { name: 'Não foi possível carregar este NFT' })).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
