import rawData from '../data/demo-data.json'
import type { DemoData } from './types'

const dateOnly = /^\d{4}-\d{2}-\d{2}$/

export function validateDemoData(value: unknown): DemoData {
  const data = value as DemoData
  if (!data || data.schemaVersion !== 1 || data.term?.weekCount !== 15) throw new Error('Unsupported demo fixture')
  const courseIds = new Set<string>()
  for (const course of data.courses ?? []) {
    if (!course.id || courseIds.has(course.id)) throw new Error(`Invalid or duplicate course ID: ${course.id}`)
    courseIds.add(course.id)
    if (!Number.isFinite(course.units) || course.units <= 0) throw new Error(`Invalid units for ${course.id}`)
    if (!Array.isArray(course.programTags) || !course.programTags.length || course.programTags.some((tag) => typeof tag !== 'string' || !tag.trim())) {
      throw new Error(`Invalid program tags for ${course.id}`)
    }
    if (course.sourceUrl) {
      try { new URL(course.sourceUrl) } catch { throw new Error(`Invalid source URL for ${course.id}`) }
    }
    if (course.baseStudyHoursByWeek?.length !== 15 || course.baseStudyHoursByWeek.some((n) => !Number.isFinite(n) || n < 0)) {
      throw new Error(`Invalid workload series for ${course.id}`)
    }
  }
  const weekByNumber = new Map(data.term.weeks.map((week) => [week.week, week]))
  const assessmentIds = new Set<string>()
  for (const assessment of data.assessments ?? []) {
    if (!assessment.id || assessmentIds.has(assessment.id)) throw new Error(`Invalid or duplicate assessment ID: ${assessment.id}`)
    assessmentIds.add(assessment.id)
    if (!courseIds.has(assessment.courseId)) throw new Error(`Unknown assessment course: ${assessment.courseId}`)
    if (!Number.isInteger(assessment.week) || assessment.week < 1 || assessment.week > 15) throw new Error(`Invalid week: ${assessment.id}`)
    if (!dateOnly.test(assessment.dueDate)) throw new Error(`Invalid due date: ${assessment.id}`)
    const week = weekByNumber.get(assessment.week)
    if (!week || assessment.dueDate < week.startDate || assessment.dueDate > week.endDate) throw new Error(`Due date outside week: ${assessment.id}`)
    if (!Number.isFinite(assessment.additionalStudyHours) || assessment.additionalStudyHours < 0) throw new Error(`Invalid assessment hours: ${assessment.id}`)
  }
  return data
}

export const demoData = validateDemoData(rawData)
export const courseMap = new Map(demoData.courses.map((course) => [course.id, course]))
export const assessmentMap = new Map(demoData.assessments.map((assessment) => [assessment.id, assessment]))
export const planA = demoData.preparedPlans.find((plan) => plan.id === 'plan-a')!
export const planB = demoData.preparedPlans.find((plan) => plan.id === 'plan-b')!
