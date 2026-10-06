import { expect, test } from '@playwright/test'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

test('self-contained email package opens directly from file', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'one offline-file verification is sufficient')
  const offlineFile = resolve('deliverables', 'LoadLens-Email-Package', 'Open LoadLens.html')
  await page.goto(`${pathToFileURL(offlineFile).href}#/dashboard`)
  await expect(page.getByRole('heading', { name: 'Your semester at a glance' })).toBeVisible()
  await expect(page.getByText('23 hrs', { exact: true }).first()).toBeVisible()
  await page.getByRole('link', { name: 'Build' }).click()
  await expect(page.getByRole('heading', { name: 'Build your semester' })).toBeVisible()
  await expect(page.locator('.build-summary')).toContainText('4 courses · 16 units')
})
