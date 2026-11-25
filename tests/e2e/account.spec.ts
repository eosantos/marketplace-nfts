import { expect, test, type Page } from '@playwright/test'
import { login, resetApp } from './helpers'

// PNG 1x1 válido.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

async function openProfile(page: Page): Promise<void> {
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await resetApp(page)
  await login(page)
})

test('rotas de conta exigem login e voltam ao destino depois', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.removeItem('kurio:session')
  })
  await page.goto('/wallets')
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await login(page, undefined, '/wallets')
  await expect(page).toHaveURL(/\/wallets/)
  await expect(page.getByRole('main').getByRole('navigation', { name: 'Meu perfil' })).toBeVisible()
})

test('edita o perfil e o nome persiste após recarregar', async ({ page }) => {
  await openProfile(page)
  const name = page.getByLabel('Nome de exibição')
  await name.fill('Alice Editada')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Perfil atualizado.')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Alice Editada')
})

test('nome de usuário já usado mostra o erro da API no campo', async ({ page }) => {
  await openProfile(page)
  await page.getByLabel('Nome de usuário').fill('bob_mendes')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Nome de usuário indisponível.')).toBeVisible()
})

test('avatar: envia uma imagem válida, recusa tipo/tamanho inválidos e remove', async ({ page }) => {
  await openProfile(page)
  const input = page.getByTestId('avatar-input')

  await input.setInputFiles({ name: 'a.gif', mimeType: 'image/gif', buffer: PNG })
  await expect(page.getByText('Use uma imagem PNG, JPEG ou WebP.')).toBeVisible()

  await input.setInputFiles({ name: 'big.png', mimeType: 'image/png', buffer: Buffer.alloc(301 * 1024) })
  await expect(page.getByText('A imagem deve ter no máximo 300 KB.')).toBeVisible()

  await input.setInputFiles({ name: 'ok.png', mimeType: 'image/png', buffer: PNG })
  await expect(page.getByText('Avatar atualizado.')).toBeVisible()
  await expect(page.getByAltText(/Avatar de Alice/)).toBeVisible()

  await page.getByRole('button', { name: 'Remover' }).click()
  await expect(page.getByText('Avatar removido.')).toBeVisible()
})

test('troca de senha: valida confirmação, recusa senha atual errada e conclui', async ({ page }) => {
  await openProfile(page)
  const current = page.getByPlaceholder('Senha atual', { exact: true })
  const next = page.getByPlaceholder('Nova senha', { exact: true })
  const confirm = page.getByPlaceholder('Confirmar nova senha', { exact: true })
  const submit = page.getByRole('button', { name: 'Alterar senha' })

  await current.fill('Alice@123')
  await next.fill('Nova@12345')
  await confirm.fill('diferente')
  await submit.click()
  await expect(page.getByText('As senhas não coincidem.')).toBeVisible()

  await current.fill('errada123')
  await confirm.fill('Nova@12345')
  await submit.click()
  await expect(page.getByText('Senha atual incorreta.')).toBeVisible()

  await current.fill('Alice@123')
  await submit.click()
  await expect(page.getByText(/Senha alterada/)).toBeVisible()
})

test('carteiras: edita a principal, bloqueia endereço duplicado e promove a secundária', async ({ page }) => {
  await page.goto('/wallets')
  await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()

  const primary = page.getByRole('region', { name: 'Carteira principal' })
  await primary.getByLabel('Apelido da carteira').fill('Principal Editada')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira salva.').first()).toBeVisible()

  // Endereço da secundária na principal → erro de validação da API no campo.
  await primary.getByLabel('Endereço da carteira').fill('0x7A42E8C1B9D0F3A4C5E6B7D8A9F0C1E2B3D4A5F6')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(primary.getByRole('alert')).toBeVisible()

  await page.getByRole('button', { name: 'Tornar principal' }).click()
  await expect(page.getByText(/agora é a carteira principal/)).toBeVisible()
})

test('menu mostra itens fora do escopo como "Em breve" desabilitados', async ({ page }) => {
  await openProfile(page)
  const isMobile = (page.viewportSize()?.width ?? 1440) < 768
  test.skip(isMobile, 'No mobile o menu vira abas.')
  await expect(page.getByText('Em breve')).toHaveCount(5)
})
