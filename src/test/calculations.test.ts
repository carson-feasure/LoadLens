import expected from './expected-metrics.json'
import { assessmentKindLabel, comparisonMetrics, courseWeekContribution, matchesCourse, planMetrics, uniqueValidIds, workloadLevel } from '../domain/calculations'
import { demoData, planA, planB, validateDemoData } from '../domain/data'
import { formatDate } from '../domain/dates'

describe('canonical synthetic fixture', () => {
  test('validates courses, assessments, dates, and 15-week arrays', () => {
    expect(validateDemoData(demoData)).toBe(demoData)
    expect(demoData.courses).toHaveLength(16)
    expect(demoData.courses.every((course) => course.programTags.length > 0)).toBe(true)
    expect(new Set(demoData.assessments.map((item) => item.id)).size).toBe(demoData.assessments.length)
  })

  test('recomputes exact Plan A metrics without production expectations', () => {
    const metrics = planMetrics(planA.courseIds, expected.planA.thresholdHours)
    expect(metrics.weeklyTotals).toEqual(expected.planA.weeklyTotals)
    expect(metrics).toMatchObject({ units: 16, totalStudyHours: 240, averageWeeklyStudyHours: 16, peakHours: 23, peakWeeks: [7], highWorkloadWeeks: [6, 7, 10] })
  })

  test('recomputes exact Plan B metrics', () => {
    const metrics = planMetrics(planB.courseIds, expected.planB.thresholdHours)
    expect(metrics.weeklyTotals).toEqual(expected.planB.weeklyTotals)
    expect(metrics).toMatchObject({ units: 16, totalStudyHours: 194, peakHours: 17, peakWeeks: [7], highWorkloadWeeks: [] })
    expect(metrics.averageWeeklyStudyHours).toBeCloseTo(194 / 15)
  })

  test('threshold comparison is strict and does not mutate workload', () => {
    const twenty = planMetrics(planA.courseIds, 20)
    const nineteen = planMetrics(planA.courseIds, 19)
    expect(twenty.highWorkloadWeeks).not.toContain(14)
    expect(nineteen.highWorkloadWeeks).toContain(14)
    expect(nineteen.weeklyTotals).toEqual(twenty.weeklyTotals)
    expect(nineteen.totalStudyHours).toBe(twenty.totalStudyHours)
  })

  test('Week 7 course contributions reconcile to 23 hours', () => {
    const rows = planA.courseIds.map((id) => courseWeekContribution(id, 7))
    expect(rows.map((row) => ({ courseId: row.courseId, baseStudyHours: row.recurringHours, assessmentStudyHours: row.assessmentHours, totalStudyHours: row.totalHours }))).toEqual(expected.week7BreakdownPlanA)
    expect(rows.reduce((sum, row) => sum + row.totalHours, 0)).toBe(23)
  })

  test('comparison calculates the documented swap deltas', () => {
    const result = comparisonMetrics(planA.courseIds, planB.courseIds, 20)
    expect(result).toMatchObject({ removedCourseIds: ['writ-150'], addedCourseIds: ['ise-105'], peakReductionHours: 6, reductionAtOriginalPeakHours: 6, totalStudyHourReduction: 46, overloadedWeekReduction: 3 })
    expect(result.current.units).toBe(16)
    expect(result.updated.units).toBe(16)
  })

  test('dropping WRIT is a distinct 12-unit plan', () => {
    const metrics = planMetrics(expected.dropWrit.courseIds, 20)
    expect(metrics.weeklyTotals).toEqual(expected.dropWrit.weeklyTotals)
    expect(metrics).toMatchObject({ units: 12, peakHours: 15, totalStudyHours: 164 })
  })

  test('deduplicates IDs and ignores unknown IDs', () => {
    const ids = [...planA.courseIds, 'cog-107', 'unknown-course']
    expect(uniqueValidIds(ids)).toEqual(planA.courseIds)
    expect(planMetrics(ids, 20)).toEqual(planMetrics(planA.courseIds, 20))
  })

  test('empty plans produce zeros without fake peak weeks', () => {
    expect(planMetrics([], 20)).toEqual({ weeklyTotals: Array(15).fill(0), totalStudyHours: 0, averageWeeklyStudyHours: 0, peakHours: 0, peakWeeks: [], highWorkloadWeeks: [], units: 0 })
  })

  test('tied maxima return every week', () => {
    const course = demoData.courses.find((item) => item.id === 'arts-110')!
    const metrics = planMetrics([course.id], 80)
    const maximum = Math.max(...metrics.weeklyTotals)
    expect(metrics.peakWeeks).toEqual(metrics.weeklyTotals.flatMap((value, index) => value === maximum ? [index + 1] : []))
    expect(metrics.peakWeeks.length).toBeGreaterThan(1)
  })

  test('separates peak-to-peak and original-peak-week differences', () => {
    const currentIds = ['cog-107']
    const updatedIds = ['writ-150']
    const result = comparisonMetrics(currentIds, updatedIds, 20)
    expect(result.peakReductionHours).toBe(result.current.peakHours - result.updated.peakHours)
    const originalWeek = result.current.peakWeeks[0]!
    expect(result.reductionAtOriginalPeakHours).toBe(result.current.weeklyTotals[originalWeek - 1]! - result.updated.weeklyTotals[originalWeek - 1]!)
  })

  test('same and higher-load comparisons preserve signs', () => {
    expect(comparisonMetrics(planA.courseIds, planA.courseIds, 20).peakReductionHours).toBe(0)
    expect(comparisonMetrics(planB.courseIds, planA.courseIds, 20).peakReductionHours).toBe(-6)
  })

  test('date-only formatting does not shift the supplied date', () => {
    expect(formatDate('2026-08-31', { year: 'numeric', month: '2-digit', day: '2-digit' })).toBe('08/31/2026')
  })

  test.each([['COG107', 'cog-107'], ['cog 107', 'cog-107'], ['107', 'cog-107'], ['writing and critical reasoning', 'writ-150']])('normalizes search %s', (query, id) => {
    expect(matchesCourse(demoData.courses.find((course) => course.id === id)!, query)).toBe(true)
  })

  test('uses readable assessment labels and records public sources without changing demo math', () => {
    expect(assessmentKindLabel('exam')).toBe('Exam')
    expect(assessmentKindLabel('homework')).toBe('Assignment')
    expect(demoData.courses.filter((course) => course.sourceUrl)).toHaveLength(3)
    expect(demoData.courses.filter((course) => course.sourceUrl).every((course) => course.sourceUrl?.startsWith('https://'))).toBe(true)
    expect(planMetrics(planA.courseIds, 20).peakHours).toBe(23)
  })

  test('workload categories are derived from fixture values', () => {
    const levels = Object.fromEntries(demoData.courses.map((course) => [course.id, workloadLevel(course)]))
    expect(levels['arts-110']).toBe('light')
    expect(['light', 'moderate', 'heavy']).toContain(levels['cog-107'])
  })
})
