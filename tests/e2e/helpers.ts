import { expect, type Page } from '@playwright/test'

export const ALICE = { email: 'alice@nft.test', password: 'Alice@123' }
export const NFT_ID = 'nft_002'

/** Limpa storages, restaura o banco simulado no cenário e recarrega o app. */
export async function resetApp(page: Page, scenario = 'default'): Promise<void> {
  await page.goto('/')
  await page.waitForFunction(() => window.__mocks !== undefined)
  await page.evaluate((name) => {
    localStorage.clear()
    sessionStorage.clear()
    window.__mocks?.reset(name)
  }, scenario)
  await page.reload()
  await page.waitForFunction(() => window.__mocks !== undefined)
}

/** Troca o cenário sem apagar os dados atuais (efeito imediato nos próximos requests). */
export async function setScenario(page: Page, scenario: string): Promise<void> {
  await page.evaluate((name) => window.__mocks?.setScenario(name), scenario)
}

export async function login(page: Page, credentials = ALICE, redirect?: string): Promise<void> {
  await page.goto(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login')
  await page.getByPlaceholder('Digite seu e-mail').fill(credentials.email)
  await page.getByPlaceholder('Senha', { exact: true }).fill(credentials.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

/** Detalhe do NFT → botão de compra (desktop: "Comprar"; mobile: "Comprar NFT") → /cart. */
export async function buyNow(page: Page, nftId = NFT_ID): Promise<void> {
  await page.goto(`/nft/${nftId}`)
  const isMobile = (page.viewportSize()?.width ?? 1440) < 768
  await page
    .getByRole('button', { name: isMobile ? 'Comprar NFT' : 'Comprar', exact: true })
    .click()
  await expect(page).toHaveURL(/\/cart/)
}

/** Preenche o checkout até a revisão: conecta a carteira principal e avança. */
export async function goToReview(page: Page): Promise<void> {
  await page.getByRole('link', { name: /finalizar/i }).click()
  await expect(page).toHaveURL(/\/checkout/)
  // Espera as carteiras carregarem (o botão só existe depois da seleção automática).
  const toggle = page.getByRole('button', { name: /^(Conectar|Desconectar) carteira$/ })
  await expect(toggle).toBeVisible()
  if ((await toggle.textContent())?.startsWith('Conectar')) await toggle.click()
  await expect(page.getByText('Carteira conectada.')).toBeVisible()
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
}

export async function confirmPurchase(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
}

/**
 * Provoca a expiração de sessão por uma ação da própria tela (restaurar a sessão em reload é
 * silencioso): espera a tela assentar, troca o cenário e favorita (chamada autenticada → 401).
 */
export async function expireSessionOnDetail(page: Page): Promise<void> {
  await page.goto(`/nft/${NFT_ID}`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('button', { name: /favorit/i }).filter({ visible: true }).first()).toBeVisible()
  await setScenario(page, 'session-expired')
  await page.getByRole('button', { name: /favorit/i }).filter({ visible: true }).first().click()
}
