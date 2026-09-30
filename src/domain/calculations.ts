import { courseMap, demoData } from './data'
import type { ComparisonMetrics, Course, CourseId, PlanMetrics, WeekContribution } from './types'

export const uniqueValidIds = (ids: CourseId[]) => [...new Set(ids)].filter((id) => courseMap.has(id))

export function courseWeekContribution(courseId: CourseId, week: number): WeekContribution {
  const course = courseMap.get(courseId)
  if (!course || week < 1 || week > 15) return { courseId, recurringHours: 0, assessmentHours: 0, totalHours: 0, assessmentIds: [] }
  const recurringHours = course.baseStudyHoursByWeek[week - 1] ?? 0
  const assessments = demoData.assessments.filter((assessment) => assessment.courseId === courseId && assessment.week === week)
  const assessmentHours = assessments.reduce((sum, item) => sum + item.additionalStudyHours, 0)
  return { courseId, recurringHours, assessmentHours, totalHours: recurringHours + assessmentHours, assessmentIds: assessments.map((item) => item.id) }
}

export function planMetrics(ids: CourseId[], threshold = 20): PlanMetrics {
  const valid = uniqueValidIds(ids)
  const weeklyTotals = Array.from({ length: 15 }, (_, index) => valid.reduce((sum, id) => sum + courseWeekContribution(id, index + 1).totalHours, 0))
  const totalStudyHours = weeklyTotals.reduce((sum, value) => sum + value, 0)
  const peakHours = valid.length ? Math.max(...weeklyTotals) : 0
  return {
    weeklyTotals,
    totalStudyHours,
    averageWeeklyStudyHours: totalStudyHours / 15,
    peakHours,
    peakWeeks: valid.length ? weeklyTotals.flatMap((value, index) => value === peakHours ? [index + 1] : []) : [],
    highWorkloadWeeks: weeklyTotals.flatMap((value, index) => value > threshold ? [index + 1] : []),
    units: valid.reduce((sum, id) => sum + (courseMap.get(id)?.units ?? 0), 0),
  }
}

export function weekBreakdown(ids: CourseId[], week: number) {
  return uniqueValidIds(ids).map((id) => courseWeekContribution(id, week))
}

export function comparisonMetrics(currentIds: CourseId[], updatedIds: CourseId[], threshold: number): ComparisonMetrics {
  const current = planMetrics(currentIds, threshold)
  const updated = planMetrics(updatedIds, threshold)
  const currentSet = new Set(uniqueValidIds(currentIds))
  const updatedSet = new Set(uniqueValidIds(updatedIds))
  const originalPeakWeek = current.peakWeeks[0] ?? 1
  const maxValue = Math.max(current.peakHours, updated.peakHours, threshold)
  return {
    current, updated,
    removedCourseIds: [...currentSet].filter((id) => !updatedSet.has(id)),
    addedCourseIds: [...updatedSet].filter((id) => !currentSet.has(id)),
    peakReductionHours: current.peakHours - updated.peakHours,
    reductionAtOriginalPeakHours: current.weeklyTotals[originalPeakWeek - 1]! - updated.weeklyTotals[originalPeakWeek - 1]!,
    totalStudyHourReduction: current.totalStudyHours - updated.totalStudyHours,
    overloadedWeekReduction: current.highWorkloadWeeks.length - updated.highWorkloadWeeks.length,
    sharedYAxisMax: Math.ceil((maxValue + 2) / 5) * 5,
  }
}

export function averageCourseHours(course: Course) {
  return planMetrics([course.id]).averageWeeklyStudyHours
}

export function workloadLevel(course: Course): 'light' | 'moderate' | 'heavy' {
  const average = averageCourseHours(course)
  return average <= 3 ? 'light' : average <= 5 ? 'moderate' : 'heavy'
}

export function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/[-\s]+/g, '')
}

export function matchesCourse(course: Course, query: string) {
  const normalized = normalizeSearch(query)
  if (!normalized) return true
  return normalizeSearch(`${course.code} ${course.title}`).includes(normalized)
}

export function formatHours(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}
