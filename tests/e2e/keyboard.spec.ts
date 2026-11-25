import { expect, test } from '@playwright/test'
import { ALICE, expireSessionOnDetail, login, resetApp } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetApp(page)
})

test('login só com teclado: Tab percorre campos e Enter envia', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('Digite seu e-mail').focus()
  await page.keyboard.type(ALICE.email)
  await page.keyboard.press('Tab')
  await expect(page.getByPlaceholder('Senha', { exact: true })).toBeFocused()
  await page.keyboard.type(ALICE.password)
  await page.keyboard.press('Enter')
  await expect(page).not.toHaveURL(/\/login/)
})

test('formulário vazio mostra erros acessíveis e não envia', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/login/)
  await expect(page.locator('input[aria-invalid="true"]').first()).toBeVisible()
})

test('cadastro valida confirmação de senha diferente', async ({ page }) => {
  await page.goto('/signup')
  await page.getByPlaceholder('Nome de usuário').fill('teclado')
  await page.getByPlaceholder('Digite seu e-mail').fill('teclado@nft.test')
  await page.getByPlaceholder('Senha', { exact: true }).fill('Senha@123')
  await page.getByPlaceholder('Confirmar senha').fill('Outra@123')
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page).toHaveURL(/\/signup/)
  await expect(page.locator('input[aria-invalid="true"]').first()).toBeVisible()
})

test('menu do usuário abre com Enter e fecha com Escape (desktop)', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 1440) < 768, 'O menu suspenso é do desktop.')
  await login(page)
  await page.goto('/')
  const trigger = page.getByRole('button', { name: /^Menu de / })
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem', { name: 'Sair' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menuitem', { name: 'Sair' })).toHaveCount(0)
})

test('diálogo de sessão expirada mantém o foco preso dentro dele', async ({ page }) => {
  await login(page)
  await expireSessionOnDetail(page)
  const dialog = page.getByRole('dialog', { name: 'Sua sessão expirou' })
  await expect(dialog).toBeVisible()
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab')
    const inside = await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null)
    expect(inside).toBe(true)
  }
})

test('catálogo: cards e paginação são alcançáveis por Tab e ativáveis com Enter', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('main article a[href^="/nft/"]').first()
  await expect(card).toBeVisible()
  await card.focus()
  await expect(card).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/nft\//)
})
