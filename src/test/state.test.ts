import { createDefaultState, hydrateState, plannerReducer } from '../state/planner'
import { planA, planB } from '../domain/data'

describe('planner reducer and persistence boundary', () => {
  test('Build edits only the draft until Analyze', () => {
    const start = createDefaultState()
    const edited = plannerReducer(start, { type: 'BUILD_REMOVE', courseId: 'writ-150' })
    expect(edited.currentCourseIds).toEqual(planA.courseIds)
    expect(edited.buildDraftCourseIds).not.toContain('writ-150')
    const applied = plannerReducer(edited, { type: 'BUILD_ANALYZE' })
    expect(applied.currentCourseIds).toEqual(edited.buildDraftCourseIds)
    expect(applied.currentPlanRevision).toBe(start.currentPlanRevision + 1)
  })

  test('initial comparison snapshots current and seeds Plan B only for fixture Plan A', () => {
    const initialized = plannerReducer(createDefaultState(), { type: 'COMPARISON_INIT' })
    expect(initialized.comparison?.baselineCourseIds).toEqual(planA.courseIds)
    expect(initialized.comparison?.draftCourseIds).toEqual(planB.courseIds)
    expect(initialized.comparison?.baselineCourseIds).not.toBe(initialized.comparison?.draftCourseIds)
  })

  test('scenario edits never mutate baseline or committed plan', () => {
    const initialized = plannerReducer(createDefaultState(), { type: 'COMPARISON_INIT' })
    const edited = plannerReducer(initialized, { type: 'COMPARISON_REMOVE', courseId: 'ise-105' })
    expect(edited.currentCourseIds).toEqual(planA.courseIds)
    expect(edited.comparison?.baselineCourseIds).toEqual(planA.courseIds)
    expect(edited.comparison?.draftCourseIds).not.toContain('ise-105')
  })

  test('apply syncs committed plan and Build draft; keep does not', () => {
    const initialized = plannerReducer(createDefaultState(), { type: 'COMPARISON_INIT' })
    const applied = plannerReducer(initialized, { type: 'COMPARISON_APPLY' })
    expect(applied.currentCourseIds).toEqual(planB.courseIds)
    expect(applied.buildDraftCourseIds).toEqual(planB.courseIds)
    expect(applied.comparison).toBeNull()
    const kept = plannerReducer(initialized, { type: 'COMPARISON_KEEP' })
    expect(kept.currentCourseIds).toEqual(planA.courseIds)
    expect(kept.comparison).toBeNull()
  })

  test('selected week, limit, and reset update only intended fields', () => {
    const start = createDefaultState()
    const focused = plannerReducer(start, { type: 'SELECT_WEEK', week: 10 })
    expect(focused.selectedWeek).toBe(10)
    expect(focused.currentCourseIds).toEqual(start.currentCourseIds)
    const limited = plannerReducer(focused, { type: 'SET_LIMIT', hours: 18.5 })
    expect(limited.weeklyStudyLimitHours).toBe(18.5)
    expect(plannerReducer(limited, { type: 'RESET_DEMO' })).toEqual(createDefaultState())
  })

  test('hydrate recovers corrupted JSON', () => {
    expect(hydrateState('{broken').recovered).toBe(true)
    expect(hydrateState('{broken').state).toEqual(createDefaultState())
  })

  test('hydrate removes unknown and duplicate IDs', () => {
    const stored = { ...createDefaultState(), currentCourseIds: ['cog-107', 'cog-107', 'missing'], buildDraftCourseIds: ['writ-150', 'missing'] }
    const result = hydrateState(JSON.stringify(stored))
    expect(result.recovered).toBe(true)
    expect(result.state.currentCourseIds).toEqual(['cog-107'])
    expect(result.state.buildDraftCourseIds).toEqual(['writ-150'])
  })
})
