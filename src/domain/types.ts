export type CourseId = string
export type WeekNumber = number
export type DashboardView = 'day' | 'week' | 'semester'
export type AssessmentKind = 'exam' | 'essay' | 'project' | 'quiz' | 'reading' | 'discussion' | 'homework'

export interface WeekDefinition { week: number; startDate: string; endDate: string }
export interface Course {
  id: CourseId; code: string; title: string; units: number; color: string
  catalogGroup: 'ge-example' | 'writing' | 'major'; sectionLabel: string
  meetingPattern: string; description: string; programTags: string[]; baseStudyHoursByWeek: number[]
  sampleSyllabusOverview: string; sourceLabel: string; sourceUrl?: string; catalogVerified: false
  requirementEligibilityVerified: false; isDemo: true
}
export interface Assessment {
  id: string; courseId: CourseId; week: WeekNumber; dueDate: string; title: string
  kind: AssessmentKind; additionalStudyHours: number; sourceLabel: string; isDemo: true
}
export interface DemoData {
  schemaVersion: number; fixtureVersion: string; notice: string
  term: { id: string; label: string; weekCount: number; startDate: string; datesAreIllustrative: boolean; weeks: WeekDefinition[] }
  defaults: { currentPlanId: string; currentCourseIds: CourseId[]; weeklyStudyLimitHours: number; selectedWeek: number; dashboardView: DashboardView }
  preparedPlans: { id: string; name: string; courseIds: CourseId[] }[]
  courses: Course[]; assessments: Assessment[]
}
export interface WeekContribution {
  courseId: CourseId; recurringHours: number; assessmentHours: number
  totalHours: number; assessmentIds: string[]
}
export interface PlanMetrics {
  weeklyTotals: number[]; totalStudyHours: number; averageWeeklyStudyHours: number
  peakHours: number; peakWeeks: WeekNumber[]; highWorkloadWeeks: WeekNumber[]; units: number
}
export interface ComparisonMetrics {
  current: PlanMetrics; updated: PlanMetrics; removedCourseIds: string[]; addedCourseIds: string[]
  peakReductionHours: number; reductionAtOriginalPeakHours: number
  totalStudyHourReduction: number; overloadedWeekReduction: number; sharedYAxisMax: number
}
export interface StudySession {
  id: string; createdAt: string; initialChoice: 'plan-a' | 'plan-b'; highRiskPlan: 'plan-a' | 'plan-b'
  demandingWeeks: number[]; finalChoice: 'plan-a' | 'plan-b'; reason: string
}
