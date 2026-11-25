import { expect, test } from '@playwright/test'
import { resetApp } from './helpers'

test('imagens do catálogo mostram shimmer até carregar e depois o removem', async ({ page }) => {
  await resetApp(page)

  // Segura as imagens dos NFTs para observar o estado de carregamento.
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/assets/nfts/*.webp', async (route) => {
    await gate
    await route.continue()
  })
  await page.reload({ waitUntil: 'commit' })

  const image = page.locator('article img').first()
  await expect(image).toHaveClass(/img-skeleton/)

  release()
  await expect(image).not.toHaveClass(/img-skeleton/)
})
