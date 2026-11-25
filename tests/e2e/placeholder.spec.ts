// Placeholder E2E test — will be replaced in Step 09 (Playwright tests)
// Keeps Playwright from erroring on an empty testDir.

import { test, expect } from '@playwright/test'

test('placeholder — app loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()
})
