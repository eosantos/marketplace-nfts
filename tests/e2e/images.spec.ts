import { expect, test } from '@playwright/test'
import { resetApp } from './helpers'

// O shimmer só existe enquanto a imagem carrega (o servidor é local, então é rápido). O estado
// "carregando" é coberto pelo teste unitário de SkeletonImage; aqui garantimos o fim do ciclo.
test('imagens do catálogo carregam e perdem o shimmer', async ({ page }) => {
  await resetApp(page)
  await page.goto('/')

  const card = page.locator('article img[width="258"]').first()
  await expect(card).toBeVisible()
  await expect
    .poll(() => card.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true)
  await expect(card).not.toHaveClass(/img-skeleton/)
})
