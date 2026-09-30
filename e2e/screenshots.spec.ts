import { expect, test } from '@playwright/test'

test('capture all four main pages at the target viewport', async ({ page }, testInfo) => {
  for (const route of ['dashboard', 'build', 'overview', 'adjust']) {
    await page.goto(`/#/${route}`)
    await page.evaluate(() => localStorage.removeItem('loadlens.demo.v1'))
    await page.reload()
    await expect(page.locator('h1')).toBeVisible()
    await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-${route}.png`, fullPage: true })
  }
})
