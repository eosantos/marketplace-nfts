import { expect, test } from '@playwright/test'
import { resetApp } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetApp(page)
})

test('rota inexistente mostra a 404 com o endereço acessado e volta ao início', async ({ page }) => {
  await page.goto('/pagina-que-nao-existe')

  const heading = page.getByRole('heading', { name: 'Ops, algo deu errado por aqui' })
  await expect(heading).toBeVisible()
  await expect(heading).toBeFocused()
  await expect(page.getByText('/pagina-que-nao-existe')).toBeVisible()
  await expect(page).toHaveTitle(/Página não encontrada/)

  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page).toHaveTitle(/KURIO/)
})

test('"Voltar à página anterior" retorna ao histórico', async ({ page }) => {
  await page.goto('/login')
  await page.goto('/outra-rota-inexistente')
  await page.getByRole('button', { name: 'Voltar à página anterior' }).click()
  await expect(page).toHaveURL(/\/login/)
})
