import { expect, test } from '@playwright/test'

test('capture all main pages at the target viewport', async ({ page }, testInfo) => {
  for (const route of ['build', 'overview', 'adjust']) {
    await page.goto(`/#/${route}`)
    await page.evaluate(() => localStorage.removeItem('loadlens.demo.v1'))
    await page.reload()
    await expect(page.locator('h1')).toBeVisible()
    await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-${route}.png`, fullPage: true })
  }
})

test('capture the parsed syllabus at the target viewport', async ({ page }, testInfo) => {
  await page.route('**/api/syllabi/parse', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      syllabus: {
        course: { code: 'COG 107', title: 'Data Science for Cognitive Science', term: 'Fall 2026', section: '12345', instructor: 'Dr. Riley Rivera', units: 4, meetingPattern: 'Monday and Wednesday, 10:00–11:20 a.m.', summary: 'An introduction to data collection, visualization, and interpretation for cognitive science.' },
        selectedCourseMatch: { matches: true, explanation: 'The uploaded course code and title match COG 107.' },
        weeks: [
          { weekNumber: 1, label: 'Data and evidence', startDate: '2026-08-31', endDate: '2026-09-06', topics: ['Data and evidence'], readings: ['Chapter 1'], assignments: [{ title: 'Setup exercise', kind: 'Homework', dueDate: '2026-09-04', weight: '5%', details: 'Complete the data setup exercise.' }], workloadNotes: [] },
          { weekNumber: 2, label: 'Descriptive statistics', startDate: '2026-09-07', endDate: '2026-09-13', topics: ['Descriptive statistics', 'Distributions'], readings: ['Chapter 2'], assignments: [], workloadNotes: [] },
          { weekNumber: 3, label: 'Visualization', startDate: '2026-09-14', endDate: '2026-09-20', topics: ['Chart design', 'Visual critique'], readings: [], assignments: [{ title: 'Chart critique', kind: 'Essay', dueDate: '2026-09-18', weight: '10%', details: 'Critique one published visualization.' }], workloadNotes: [] },
        ],
        grading: [{ component: 'Setup exercises', weight: '20%', details: 'Short weekly assignments.' }, { component: 'Final project', weight: '40%', details: 'Cumulative project.' }],
        policies: ['Assignments submitted within 24 hours after the deadline receive a 10% deduction.'],
        warnings: [],
      },
      meta: { fileName: 'sample-syllabus.txt', parsedAt: '2026-10-12T12:00:00.000Z', model: 'gpt-6-luna', sizeBytes: 714 },
    }),
  }))
  await page.goto('/#/courses/cog-107?tab=syllabus&origin=current')
  await page.locator('input[type="file"]').setInputFiles({ name: 'sample-syllabus.txt', mimeType: 'text/plain', buffer: Buffer.from('sample syllabus') })
  await expect(page.getByText('Matches COG 107')).toBeVisible()
  await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-syllabus.png`, fullPage: true })
})
