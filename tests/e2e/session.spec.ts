import { expect, test, type Page } from '@playwright/test'
import { ALICE, expireSessionOnDetail, login, resetApp, setScenario } from './helpers'

const BOB = { email: 'bob@nft.test', password: 'Bob@456' }
const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768

async function logout(page: Page): Promise<void> {
  if (isMobile(page)) {
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Sair' }).filter({ visible: true }).first().click()
  } else {
    await page.goto('/')
    await page.getByRole('button', { name: /^Menu de / }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
  }
  await expect(page).not.toHaveURL(/\/(profile|wallets|cart)/)
  // Só segue depois de a sessão ser limpa de verdade (senão o próximo goto interrompe o logout).
  if (!isMobile(page)) await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible()
}

function favoriteButton(page: Page) {
  return page.getByRole('button', { name: /favorit/i }).filter({ visible: true }).first()
}

test.beforeEach(async ({ page }) => {
  await resetApp(page)
})

test('cadastro cria a conta e entra com sessão', async ({ page }) => {
  await page.goto('/signup')
  await page.getByPlaceholder('Nome de usuário').fill('novo_usuario')
  await page.getByPlaceholder('Digite seu e-mail').fill('novo@nft.test')
  await page.getByPlaceholder('Senha', { exact: true }).fill('Senha@123')
  await page.getByPlaceholder('Confirmar senha').fill('Senha@123')
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page).not.toHaveURL(/\/signup/)
  await page.goto('/profile')
  await expect(page).toHaveURL(/\/profile/)
})

test('cadastro com e-mail já usado mostra o conflito e não cria sessão', async ({ page }) => {
  await setScenario(page, 'signup-conflict')
  await page.goto('/signup')
  await page.getByPlaceholder('Nome de usuário').fill('alguem')
  await page.getByPlaceholder('Digite seu e-mail').fill(ALICE.email)
  await page.getByPlaceholder('Senha', { exact: true }).fill('Senha@123')
  await page.getByPlaceholder('Confirmar senha').fill('Senha@123')
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: /\S/ }).first()).toBeVisible()
  await expect(page).toHaveURL(/\/signup/)
})

test('login inválido não cria sessão; válido volta para a rota protegida', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('Digite seu e-mail').fill(ALICE.email)
  await page.getByPlaceholder('Senha', { exact: true }).fill('errada')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('alert').filter({ hasText: /\S/ }).first()).toBeVisible()

  await page.goto('/wallets')
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await login(page, ALICE, '/wallets')
  await expect(page).toHaveURL(/\/wallets/)
})

test('sessão persiste após recarregar e termina no logout', async ({ page }) => {
  await login(page)
  await page.goto('/profile')
  await page.reload()
  await expect(page).toHaveURL(/\/profile/)

  await logout(page)
  await page.goto('/profile')
  await expect(page).toHaveURL(/\/login/)
})

test('troca de usuário não vaza favoritos nem carrinho (Alice → Bob)', async ({ page }) => {
  await login(page)
  await page.goto('/nft/nft_002')
  await favoriteButton(page).click()
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
  const buy = isMobile(page) ? 'Comprar NFT' : 'Comprar'
  await page.getByRole('button', { name: buy, exact: true }).click()
  await expect(page).toHaveURL(/\/cart/)
  await expect(page.getByTestId('cart-total')).toBeVisible()

  await logout(page)
  await login(page, BOB)
  await page.goto('/nft/nft_002')
  await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
  await page.goto('/cart')
  await expect(page.getByTestId('cart-total')).toHaveCount(0)
  await expect(page.getByText('Alice', { exact: false }).filter({ visible: true })).toHaveCount(0)

  // E de volta: os dados de Alice continuam dela.
  await logout(page)
  await login(page)
  await page.goto('/cart')
  await expect(page.getByTestId('cart-total')).toBeVisible()
})

test('sessão expirada: diálogo, retomada pelo login e opção de visitante', async ({ page }) => {
  await login(page)
  await expireSessionOnDetail(page)
  const dialog = page.getByRole('dialog', { name: 'Sua sessão expirou' })
  await expect(dialog).toBeVisible()

  // Escape não fecha: a decisão é do usuário.
  await page.keyboard.press('Escape')
  await expect(dialog).toBeVisible()

  await dialog.getByRole('button', { name: 'Continuar como visitante' }).click()
  await expect(dialog).toHaveCount(0)
  await setScenario(page, 'default')
  await page.goto('/wallets')
  await expect(page).toHaveURL(/\/login/)
})

test('sessão expirada → "Entrar novamente" leva ao login e retoma a rota', async ({ page }) => {
  await login(page)
  await expireSessionOnDetail(page)
  const dialog = page.getByRole('dialog', { name: 'Sua sessão expirou' })
  await expect(dialog).toBeVisible()
  await setScenario(page, 'default')
  await dialog.getByRole('button', { name: 'Entrar novamente' }).click()
  await expect(page).toHaveURL(/\/login/)
  await page.getByPlaceholder('Digite seu e-mail').fill(ALICE.email)
  await page.getByPlaceholder('Senha', { exact: true }).fill(ALICE.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  // Retoma de onde parou: a tela em que a sessão expirou.
  await expect(page).toHaveURL(/\/nft\/nft_002/)
})

test.describe('favoritos', () => {
  test('favoritar persiste após recarregar e desfavoritar remove', async ({ page }) => {
    await login(page)
    await page.goto('/nft/nft_002')
    await favoriteButton(page).click()
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
    // Espera o servidor confirmar antes de recarregar (senão a requisição é cancelada).
    await expect(page.getByText('Adicionado aos favoritos.')).toBeVisible()
    await page.reload()
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
    await favoriteButton(page).click()
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
  })

  test('falha na mutação reverte a UI e avisa', async ({ page }) => {
    await login(page)
    await page.goto('/nft/nft_002')
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
    await setScenario(page, 'http-5xx')
    await favoriteButton(page).click()
    await expect(page.getByText(/Não foi possível atualizar seus favoritos/)).toBeVisible()
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false')
  })

  test('visitante é levado ao login e a ação é executada ao voltar', async ({ page }) => {
    await page.goto('/nft/nft_002')
    await favoriteButton(page).click()
    await expect(page).toHaveURL(/\/login/)
    await login(page, ALICE, '/nft/nft_002')
    await expect(page).toHaveURL(/\/nft\/nft_002/)
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
  })
})
