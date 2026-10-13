import { expect, test } from '@playwright/test'

const storageKey = 'loadlens.demo.v1'

test.beforeEach(async ({ page }) => {
  await page.goto('/#/overview')
  await page.evaluate((key) => localStorage.removeItem(key), storageKey)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Your semester at a glance' })).toBeVisible()
})

test('Overview is the first tab and default landing route, with Build second', async ({ page }, testInfo) => {
  await page.goto('/#/')
  await expect(page).toHaveURL(/#\/overview$/)
  await expect(page.getByRole('heading', { name: 'Your semester at a glance' })).toBeVisible()
  await expect(page.locator('.site-header .term-chip')).toHaveText('Fall 2026')
  await expect(page.locator('.desktop-nav .nav-link')).toHaveText(['Overview', 'Build'])
  await expect(page.locator('.desktop-nav').getByRole('link', { name: 'Dashboard', exact: true })).toHaveCount(0)
  await expect(page.locator('.desktop-nav').getByRole('link', { name: 'Adjust', exact: true })).toHaveCount(0)
  if (testInfo.project.name === 'mobile-390') {
    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(page.locator('.mobile-nav .nav-link')).toHaveText(['Overview', 'Build'])
    await expect(page.locator('.mobile-nav').getByRole('link', { name: 'Dashboard', exact: true })).toHaveCount(0)
    await expect(page.locator('.mobile-nav').getByRole('link', { name: 'Adjust', exact: true })).toHaveCount(0)
  }
})

test('the retired dashboard URL redirects to the consolidated overview', async ({ page }) => {
  await page.goto('/#/dashboard')
  await expect(page).toHaveURL(/#\/overview$/)
  await expect(page.getByRole('heading', { name: 'Your semester at a glance' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toHaveCount(0)
})

test('overview exposes the requested summary cards, all weeks, schedule views, and preference updates', async ({ page }) => {
  await expect(page.locator('.header-metrics .metric-card').first()).toContainText('Semester study')
  await expect(page.locator('.header-metrics .metric-card').first()).toContainText('240 hrs')
  await expect(page.locator('.header-metrics .metric-card').nth(1)).toContainText('Peak week')
  await expect(page.getByText('23 hrs', { exact: true }).first()).toBeVisible()
  await expect(page.locator('.overview-page .chart-visual')).toHaveCount(1)
  await expect(page.locator('.overview-page .bar-course-label[data-course-code="COG 107"]').first()).toBeVisible()
  await expect(page.locator('.overview-page .bar-course-label[data-course-code="WRIT 150"]').first()).toBeVisible()
  await expect(page.locator('.overview-page .course-legend li').filter({ hasText: 'COG 107Data Science for Cognitive Science' })).toBeVisible()
  const selectedStack = page.locator('[data-testid="overview-workload-chart"] .selected-stack-summary')
  await expect(selectedStack).toContainText('Week 7 · 23 hrs')
  await expect(selectedStack).toContainText('PEAK WEEK')
  await expect(selectedStack).toContainText('ABOVE LIMIT')
  await expect(selectedStack).toContainText('COG 107')
  await expect(selectedStack).toContainText('Exam · Midterm')
  await expect(selectedStack).toContainText('WRIT 150')
  await expect(selectedStack).toContainText('Essay · Essay due')
  const aboveLimit = page.locator('[data-testid="overview-workload-chart"] .above-limit-summary')
  await expect(aboveLimit).toContainText('Above limit')
  await expect(aboveLimit.getByRole('button')).toHaveCount(3)
  await aboveLimit.getByRole('button', { name: /Week 7.*23 hrs/ }).click()
  const breakdown = page.getByTestId('week-breakdown')
  await expect(breakdown).toContainText('ABOVE LIMIT')
  await expect(breakdown).toContainText('COG 107')
  await expect(breakdown).toContainText('Data Science for Cognitive Science')
  await expect(breakdown).toContainText('Midterm')
  await expect(breakdown).toContainText('Exam · Midterm')
  await expect(page.locator('.overview-page .upcoming')).toHaveCount(0)
  await page.locator('.segmented').getByRole('button', { name: 'Week', exact: true }).click()
  await expect(page.getByRole('heading', { name: /Semester agenda/i })).toBeVisible()
  await page.locator('.segmented').getByRole('button', { name: 'Day', exact: true }).click()
  await page.locator('.day-picker button').nth(5).click()
  await expect(page.getByText('No sample due items')).toBeVisible()
  await page.getByRole('button', { name: /Study limit:/ }).click()
  await page.getByLabel('Weekly study-time limit').fill('24')
  await page.getByRole('button', { name: 'Save limit' }).click()
  await expect(page.getByRole('button', { name: /Study limit: 24 hrs\/week/ })).toBeVisible()
  await expect(page.getByText('No weeks above limit')).toBeVisible()
})

test('Build draft stays separate, preserves search, resizes, and commits through Analyze', async ({ page }, testInfo) => {
  await page.goto('/#/build')
  await page.locator('.build-summary').getByRole('button', { name: 'Add course' }).click()
  await expect(page.getByRole('dialog', { name: 'Add a course' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Add a course' })).toBeHidden()
  await page.locator('.build-discovery > .catalog-controls').getByPlaceholder('Search by course name or number').fill('GEOL107')
  const result = page.locator('.suggestion-card .catalog-card').filter({ hasText: 'GEOL 107' })
  await expect(result).toBeVisible()
  await result.getByRole('link', { name: 'GEOL 107' }).click()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.locator('.build-discovery > .catalog-controls').getByPlaceholder('Search by course name or number')).toHaveValue('GEOL107')
  await result.getByRole('button', { name: 'Add' }).click()
  await expect(page.locator('.build-summary')).toContainText('5 courses · 20 units')
  await page.setViewportSize(testInfo.project.name === 'mobile-390' ? { width: 1440, height: 1000 } : { width: 390, height: 844 })
  await expect(page.locator('.build-summary')).toContainText('5 courses · 20 units')
  await page.goto('/#/overview')
  await expect(page.getByText('240 hrs', { exact: true })).toBeVisible()
  await page.goto('/#/build')
  await expect(page.locator('.build-summary')).toContainText('5 courses · 20 units')
  await page.getByRole('button', { name: /Analyze my workload/i }).click()
  await expect(page).toHaveURL(/#\/overview/)
  await expect(page.getByText('240 hrs', { exact: true })).not.toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Your semester at a glance' })).toBeVisible()
})

test('catalog cards support rich comparison and the demo interest filter', async ({ page }) => {
  await page.goto('/#/build')
  const controls = page.locator('.build-discovery > .catalog-controls')
  const search = controls.getByPlaceholder('Search by course name or number')
  await search.fill('GEOL107')
  const card = page.locator('.suggestion-card .catalog-card').filter({ hasText: 'GEOL 107' })
  await expect(card).toContainText('USC lists GEOL 107 as Oceanography')
  await expect(card).toContainText('Meeting')
  await expect(card).toContainText('Mon/Wed 15:00')
  await expect(card).toContainText('avg hrs/week')
  await expect(card).toContainText('Demo interests')
  await controls.getByLabel('Major / interest (demo)').selectOption('Environment')
  await expect(card).toBeVisible()
  await search.fill('')
  await expect(page.locator('.suggestion-card .catalog-card')).toHaveCount(2)
  await expect(page.locator('.suggestion-card')).toContainText('ENVR 140')
  await controls.getByRole('button', { name: 'Clear' }).click()
  await expect(controls.getByLabel('Major / interest (demo)')).toHaveValue('all')
})

test('course details keep plan context and expose all three tabs', async ({ page }) => {
  await page.route('**/api/syllabi/parse', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        syllabus: {
          course: { code: 'COG 107', title: 'Data Science for Cognitive Science', term: 'Fall 2026', section: '12345', instructor: 'Dr. Rivera', units: 4, meetingPattern: 'Mon/Wed 10:00–11:20', summary: 'Data analysis foundations for cognitive science.' },
          selectedCourseMatch: { matches: true, explanation: 'The uploaded course code and title match COG 107.' },
          weeks: [
            { weekNumber: 1, label: 'Introduction', startDate: '2026-08-31', endDate: '2026-09-06', topics: ['Data and evidence'], readings: ['Chapter 1'], assignments: [{ title: 'Reflection', kind: 'Homework', dueDate: '2026-09-04', weight: '5%', details: 'One page.' }], workloadNotes: ['Complete the setup exercise.'] },
            { weekNumber: 2, label: 'Descriptive statistics', startDate: '2026-09-07', endDate: '2026-09-13', topics: ['Distributions'], readings: [], assignments: [], workloadNotes: [] },
          ],
          grading: [{ component: 'Homework', weight: '30%', details: 'Weekly assignments.' }],
          policies: ['Late work loses 10% per day.'],
          warnings: [],
        },
        meta: { fileName: 'cog107-syllabus.txt', parsedAt: '2026-10-12T12:00:00.000Z', model: 'gpt-6-luna', sizeBytes: 180 },
      }),
    })
  })
  await page.goto('/#/courses/cog-107?origin=current')
  await expect(page.getByRole('heading', { name: 'Data Science for Cognitive Science' })).toBeVisible()
  await expect(page.locator('.course-page .chart-visual')).toHaveCount(0)
  await expect(page.getByTestId('course-workload-list').locator('.course-week-row')).toHaveCount(15)
  await page.getByTestId('course-workload-list').getByRole('button', { name: /Week 7/ }).click()
  await expect(page.getByText('Selected Week 7')).toBeVisible()
  await expect(page.getByTestId('course-workload-list').getByRole('button', { name: /Week 7/ })).toContainText('Midterm')
  await page.getByRole('tab', { name: 'Syllabus' }).click()
  await expect(page.getByRole('heading', { name: 'Syllabus', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Upload Syllabus' })).toBeVisible()
  await page.locator('input[type="file"]').setInputFiles({ name: 'cog107-syllabus.txt', mimeType: 'text/plain', buffer: Buffer.from('COG 107 syllabus\nWeek 1: Data and evidence') })
  await expect(page.getByRole('heading', { name: 'COG 107 · Data Science for Cognitive Science' })).toBeVisible()
  await expect(page.getByText('Matches COG 107')).toBeVisible()
  await expect(page.locator('.parsed-week')).toHaveCount(2)
  await expect(page.locator('.parsed-week-list').getByText('Distributions', { exact: true })).toBeVisible()
  await page.getByText('View parsed JSON').click()
  await expect(page.locator('.syllabus-json pre')).toContainText('selectedCourseMatch')
  await page.reload()
  await expect(page.getByText('Matches COG 107')).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await page.getByRole('tab', { name: 'Details' }).click()
  await expect(page.getByRole('heading', { name: 'Illustrative only' })).toBeVisible()
  await expect(page.getByText(/workload estimates.*remain illustrative/i)).toBeVisible()
  await page.goto('/#/courses/not-real')
  await expect(page.getByRole('heading', { name: /isn’t available/ })).toBeVisible()
})

test('default comparison is correct, edits are isolated, and Apply persists', async ({ page }) => {
  await page.goto('/#/adjust')
  await expect(page.getByText('16 units')).toHaveCount(2)
  await expect(page.locator('.mini-chart-card').first()).toContainText('23 hrs')
  await expect(page.locator('.mini-chart-card').nth(1)).toContainText('17 hrs')
  await expect(page.locator('.mini-chart-card').first()).toContainText('3 above-limit weeks')
  await expect(page.locator('.mini-chart-card').nth(1)).toContainText('0 above-limit weeks')
  await expect(page.locator('.comparison-card').first()).toContainText('WRIT 150')
  await expect(page.locator('.comparison-card').nth(1).locator('.course-row-main > a').filter({ hasText: 'WRIT 150' })).toHaveCount(0)
  await page.getByRole('button', { name: /Use new schedule/i }).click()
  await page.getByRole('button', { name: 'Skip reason' }).click()
  await expect(page).toHaveURL(/#\/overview/)
  await expect(page.getByText('194 hrs', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('194 hrs', { exact: true })).toBeVisible()
  await page.goto('/#/build')
  await expect(page.locator('.build-summary')).toContainText('ISE 105')
})

test('study captures a local response without applying its plan', async ({ page }) => {
  await page.goto('/#/study')
  await page.locator('.study-plan').filter({ hasText: 'Plan A' }).click()
  await page.getByRole('button', { name: /Inspect workload/ }).click()
  await page.getByRole('button', { name: 'Plan A' }).click()
  await page.locator('.week-check-grid label').filter({ hasText: /^W7$/ }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Plan B' }).click()
  await page.getByLabel('What influenced your decision?').fill('Week 7 has fewer overlapping assessment hours in Plan B.')
  await page.getByRole('button', { name: /Save local response/ }).click()
  await expect(page.getByRole('heading', { name: 'Thank you' })).toBeVisible()
  await page.getByRole('link', { name: 'Return to overview' }).click()
  await expect(page.locator('.header-metrics .metric-card').first()).toContainText('240 hrs')
  await expect(page.locator('.my-courses-card')).toContainText('WRIT 150')
})

test('Keep Current and Reset demo preserve then restore the default plan', async ({ page }) => {
  await page.goto('/#/adjust')
  await page.getByRole('button', { name: 'Keep current' }).click()
  await page.getByRole('button', { name: 'Skip reason' }).click()
  await expect(page).toHaveURL(/#\/overview/)
  await expect(page.getByText('240 hrs', { exact: true })).toBeVisible()
  await page.goto('/#/build')
  const writRow = page.locator('.build-summary .course-list li').filter({ hasText: 'WRIT 150' })
  await writRow.getByRole('button', { name: 'Remove WRIT 150' }).click()
  await expect(page.locator('.build-summary')).toContainText('3 courses · 12 units')
  await page.getByRole('button', { name: /Open.*menu/ }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.locator('.build-summary')).toContainText('4 courses · 16 units')
  await expect(page.locator('.build-summary')).toContainText('WRIT 150')
})

test('mobile menu, corrupted storage recovery, and unknown route work', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'mobile-specific flow')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('dialog', { name: 'Navigation and demo options' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Navigation and demo options' })).toBeHidden()
  await page.evaluate((key) => localStorage.setItem(key, '{broken'), storageKey)
  await page.reload()
  await expect(page.getByText(/recovered with valid sample data/i)).toBeVisible()
  await page.goto('/#/somewhere-unknown')
  await expect(page.getByRole('heading', { name: 'That route wandered off campus' })).toBeVisible()
})

test('page has no whole-document horizontal overflow', async ({ page }) => {
  for (const route of ['build', 'overview', 'adjust', 'courses/cog-107?tab=syllabus&origin=current']) {
    await page.goto(`/#/${route}`)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  }
})

test('fallback widths remain free of whole-document horizontal overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'one cross-width pass is sufficient')
  for (const viewport of [{ width: 360, height: 800 }, { width: 430, height: 900 }, { width: 768, height: 900 }, { width: 1280, height: 900 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/#/overview')
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  }
})
