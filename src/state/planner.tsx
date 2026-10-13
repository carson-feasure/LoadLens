import { createContext, useContext, useEffect, useMemo, useReducer, useState, type Dispatch, type ReactNode } from 'react'
import { courseMap, demoData, planA, planB } from '../domain/data'
import { uniqueValidIds } from '../domain/calculations'
import type { DashboardView, StudySession } from '../domain/types'
import { validateParsedSyllabus, type SavedSyllabus } from '../domain/syllabus'

export const STORAGE_KEY = 'loadlens.demo.v1'

export interface ComparisonState {
  baselineCourseIds: string[]; draftCourseIds: string[]; baselineRevision: number
}
export interface PlannerState {
  schemaVersion: 1; fixtureVersion: string; currentCourseIds: string[]; currentPlanRevision: number
  buildDraftCourseIds: string[]; selectedWeek: number; weeklyStudyLimitHours: number
  dashboardView: DashboardView; selectedDate: string; comparison: ComparisonState | null
  studySessions: StudySession[]; uploadedSyllabi: Record<string, SavedSyllabus>
}

export type PlannerAction =
  | { type: 'BUILD_ADD'; courseId: string } | { type: 'BUILD_REMOVE'; courseId: string }
  | { type: 'BUILD_RESET' } | { type: 'BUILD_ANALYZE' }
  | { type: 'SELECT_WEEK'; week: number } | { type: 'SELECT_DATE'; date: string }
  | { type: 'SET_DASHBOARD_VIEW'; view: DashboardView } | { type: 'SET_LIMIT'; hours: number }
  | { type: 'COMPARISON_INIT' } | { type: 'COMPARISON_ADD'; courseId: string }
  | { type: 'COMPARISON_REMOVE'; courseId: string } | { type: 'COMPARISON_REPLACE'; oldId: string; newId: string }
  | { type: 'COMPARISON_RESET' } | { type: 'COMPARISON_KEEP' } | { type: 'COMPARISON_APPLY' }
  | { type: 'SYLLABUS_SAVE'; courseId: string; syllabus: SavedSyllabus } | { type: 'SYLLABUS_REMOVE'; courseId: string }
  | { type: 'STUDY_SAVE'; session: StudySession } | { type: 'RESET_DEMO' }

export function createDefaultState(): PlannerState {
  return {
    schemaVersion: 1,
    fixtureVersion: demoData.fixtureVersion,
    currentCourseIds: [...demoData.defaults.currentCourseIds],
    currentPlanRevision: 1,
    buildDraftCourseIds: [...demoData.defaults.currentCourseIds],
    selectedWeek: demoData.defaults.selectedWeek,
    weeklyStudyLimitHours: demoData.defaults.weeklyStudyLimitHours,
    dashboardView: demoData.defaults.dashboardView,
    selectedDate: demoData.term.weeks[demoData.defaults.selectedWeek - 1]!.startDate,
    comparison: null,
    studySessions: [],
    uploadedSyllabi: {},
  }
}

const equalIds = (a: string[], b: string[]) => a.length === b.length && a.every((value, index) => value === b[index])
const isDefaultPlanA = (ids: string[]) => equalIds(uniqueValidIds(ids), planA.courseIds)

export function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case 'BUILD_ADD':
      return { ...state, buildDraftCourseIds: uniqueValidIds([...state.buildDraftCourseIds, action.courseId]) }
    case 'BUILD_REMOVE':
      return { ...state, buildDraftCourseIds: state.buildDraftCourseIds.filter((id) => id !== action.courseId) }
    case 'BUILD_RESET':
      return { ...state, buildDraftCourseIds: [...state.currentCourseIds] }
    case 'BUILD_ANALYZE': {
      if (!state.buildDraftCourseIds.length) return state
      return { ...state, currentCourseIds: [...state.buildDraftCourseIds], currentPlanRevision: state.currentPlanRevision + 1, comparison: null }
    }
    case 'SELECT_WEEK': {
      const week = Math.min(15, Math.max(1, Math.round(action.week)))
      return { ...state, selectedWeek: week, selectedDate: demoData.term.weeks[week - 1]!.startDate }
    }
    case 'SELECT_DATE':
      return { ...state, selectedDate: action.date }
    case 'SET_DASHBOARD_VIEW':
      return { ...state, dashboardView: action.view }
    case 'SET_LIMIT':
      return Number.isFinite(action.hours) && action.hours >= 1 && action.hours <= 80 ? { ...state, weeklyStudyLimitHours: action.hours } : state
    case 'COMPARISON_INIT':
      if (state.comparison?.baselineRevision === state.currentPlanRevision) return state
      return { ...state, comparison: { baselineCourseIds: [...state.currentCourseIds], draftCourseIds: isDefaultPlanA(state.currentCourseIds) ? [...planB.courseIds] : [...state.currentCourseIds], baselineRevision: state.currentPlanRevision } }
    case 'COMPARISON_ADD':
      if (!state.comparison) return state
      return { ...state, comparison: { ...state.comparison, draftCourseIds: uniqueValidIds([...state.comparison.draftCourseIds, action.courseId]) } }
    case 'COMPARISON_REMOVE':
      if (!state.comparison) return state
      return { ...state, comparison: { ...state.comparison, draftCourseIds: state.comparison.draftCourseIds.filter((id) => id !== action.courseId) } }
    case 'COMPARISON_REPLACE':
      if (!state.comparison) return state
      return { ...state, comparison: { ...state.comparison, draftCourseIds: uniqueValidIds(state.comparison.draftCourseIds.map((id) => id === action.oldId ? action.newId : id)) } }
    case 'COMPARISON_RESET':
      if (!state.comparison) return state
      return { ...state, comparison: { ...state.comparison, draftCourseIds: [...state.comparison.baselineCourseIds] } }
    case 'COMPARISON_KEEP':
      return { ...state, comparison: null }
    case 'COMPARISON_APPLY': {
      if (!state.comparison) return state
      const next = uniqueValidIds(state.comparison.draftCourseIds)
      return { ...state, currentCourseIds: next, buildDraftCourseIds: next, currentPlanRevision: state.currentPlanRevision + 1, comparison: null }
    }
    case 'SYLLABUS_SAVE':
      if (!courseMap.has(action.courseId)) return state
      return { ...state, uploadedSyllabi: { ...state.uploadedSyllabi, [action.courseId]: action.syllabus } }
    case 'SYLLABUS_REMOVE': {
      if (!(action.courseId in state.uploadedSyllabi)) return state
      const uploadedSyllabi = { ...state.uploadedSyllabi }
      delete uploadedSyllabi[action.courseId]
      return { ...state, uploadedSyllabi }
    }
    case 'STUDY_SAVE':
      return { ...state, studySessions: [...state.studySessions, action.session] }
    case 'RESET_DEMO':
      return createDefaultState()
    default:
      return state
  }
}

export function hydrateState(raw: string | null): { state: PlannerState; recovered: boolean } {
  if (!raw) return { state: createDefaultState(), recovered: false }
  try {
    const stored = JSON.parse(raw) as Partial<PlannerState>
    if (stored.schemaVersion !== 1 || stored.fixtureVersion !== demoData.fixtureVersion) throw new Error('version')
    const defaults = createDefaultState()
    const currentCourseIds = uniqueValidIds(stored.currentCourseIds ?? [])
    const buildDraftCourseIds = uniqueValidIds(stored.buildDraftCourseIds ?? currentCourseIds)
    const selectedWeek = Number.isInteger(stored.selectedWeek) && stored.selectedWeek! >= 1 && stored.selectedWeek! <= 15 ? stored.selectedWeek! : defaults.selectedWeek
    const limit = Number.isFinite(stored.weeklyStudyLimitHours) && stored.weeklyStudyLimitHours! >= 1 && stored.weeklyStudyLimitHours! <= 80 ? stored.weeklyStudyLimitHours! : defaults.weeklyStudyLimitHours
    const view = ['day', 'week', 'semester'].includes(stored.dashboardView ?? '') ? stored.dashboardView as DashboardView : defaults.dashboardView
    const comparison = stored.comparison && stored.comparison.baselineRevision === stored.currentPlanRevision ? {
      baselineCourseIds: uniqueValidIds(stored.comparison.baselineCourseIds ?? []),
      draftCourseIds: uniqueValidIds(stored.comparison.draftCourseIds ?? []),
      baselineRevision: stored.comparison.baselineRevision,
    } : null
    const uploadedSyllabi: Record<string, SavedSyllabus> = {}
    let recoveredSyllabi = false
    if (stored.uploadedSyllabi != null && (typeof stored.uploadedSyllabi !== 'object' || Array.isArray(stored.uploadedSyllabi))) {
      recoveredSyllabi = true
    } else {
      for (const [courseId, rawSyllabus] of Object.entries(stored.uploadedSyllabi ?? {})) {
        try {
          if (!courseMap.has(courseId) || !rawSyllabus || typeof rawSyllabus !== 'object') throw new Error('invalid syllabus')
          const candidate = rawSyllabus as Partial<SavedSyllabus>
          if (typeof candidate.fileName !== 'string' || typeof candidate.model !== 'string' || typeof candidate.parsedAt !== 'string' || Number.isNaN(Date.parse(candidate.parsedAt)) || !Number.isFinite(candidate.sizeBytes) || candidate.sizeBytes! < 1) {
            throw new Error('invalid syllabus metadata')
          }
          uploadedSyllabi[courseId] = {
            fileName: candidate.fileName,
            model: candidate.model,
            parsedAt: candidate.parsedAt,
            sizeBytes: candidate.sizeBytes!,
            data: validateParsedSyllabus(candidate.data),
          }
        } catch {
          recoveredSyllabi = true
        }
      }
    }
    const recoveredIds = currentCourseIds.length !== (stored.currentCourseIds?.length ?? 0) || buildDraftCourseIds.length !== (stored.buildDraftCourseIds?.length ?? currentCourseIds.length)
    return { state: { ...defaults, ...stored, currentCourseIds, buildDraftCourseIds, selectedWeek, weeklyStudyLimitHours: limit, dashboardView: view, comparison, studySessions: Array.isArray(stored.studySessions) ? stored.studySessions : [], uploadedSyllabi }, recovered: recoveredIds || recoveredSyllabi }
  } catch {
    return { state: createDefaultState(), recovered: true }
  }
}

interface PlannerContextValue { state: PlannerState; dispatch: Dispatch<PlannerAction>; notice: string | null; clearNotice: () => void; persistenceAvailable: boolean }
const PlannerContext = createContext<PlannerContextValue | null>(null)

export function PlannerProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => {
    try { return hydrateState(window.localStorage.getItem(STORAGE_KEY)) }
    catch { return { state: createDefaultState(), recovered: true } }
  }, [])
  const [state, dispatch] = useReducer(plannerReducer, initial.state)
  const [notice, setNotice] = useState<string | null>(initial.recovered ? 'Stored demo data could not be fully restored. LoadLens recovered with valid sample data.' : null)
  const [persistenceAvailable, setPersistenceAvailable] = useState(true)

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setPersistenceAvailable(true) }
    catch { setPersistenceAvailable(false); setNotice('Browser storage is unavailable. Changes will last only until this tab closes.') }
  }, [state])

  return <PlannerContext.Provider value={{ state, dispatch, notice, clearNotice: () => setNotice(null), persistenceAvailable }}>{children}</PlannerContext.Provider>
}

export function usePlanner() {
  const value = useContext(PlannerContext)
  if (!value) throw new Error('usePlanner must be used within PlannerProvider')
  return value
}
