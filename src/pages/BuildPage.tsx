import { useMemo, useState } from 'react'
import { ArrowRight, Plus, RotateCcw } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { demoData } from '../domain/data'
import { planMetrics } from '../domain/calculations'
import { usePlanner } from '../state/planner'
import { CatalogGrid, CourseFilters, CourseList, CoursePicker, useCatalog } from '../components/Courses'
import { DemoNotice, PageHeader } from '../components/Shared'

export function BuildPage() {
  const { state, dispatch } = usePlanner()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [message, setMessage] = useState('')
  const query = searchParams.get('q') ?? ''
  const rawGroup = searchParams.get('group')
  const group: 'all' | 'ge-example' | 'writing' | 'major' = ['ge-example', 'writing', 'major'].includes(rawGroup ?? '') ? rawGroup as 'ge-example' | 'writing' | 'major' : 'all'
  const rawLevel = searchParams.get('level')
  const level: 'all' | 'light' | 'moderate' | 'heavy' = ['light', 'moderate', 'heavy'].includes(rawLevel ?? '') ? rawLevel as 'light' | 'moderate' | 'heavy' : 'all'
  const sort: 'code' | 'workload' = searchParams.get('sort') === 'workload' ? 'workload' : 'code'
  const updateParam = (key: string, value: string, defaultValue: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (!value || value === defaultValue) next.delete(key); else next.set(key, value)
      return next
    }, { replace: true })
  }
  const setQuery = (value: string) => updateParam('q', value, '')
  const setGroup = (value: typeof group) => updateParam('group', value, 'all')
  const setLevel = (value: typeof level) => updateParam('level', value, 'all')
  const setSort = (value: typeof sort) => updateParam('sort', value, 'code')
  const filtered = useCatalog(query, group, level, sort)
  const isFiltering = Boolean(query || group !== 'all' || level !== 'all' || sort !== 'code')
  const suggested = useMemo(() => demoData.courses.filter((course) => !state.buildDraftCourseIds.includes(course.id)).slice(0, 3), [state.buildDraftCourseIds])
  const metrics = planMetrics(state.buildDraftCourseIds)
  const draftDiffers = JSON.stringify(state.buildDraftCourseIds) !== JSON.stringify(state.currentCourseIds)
  const add = (id: string) => {
    const course = demoData.courses.find((item) => item.id === id)
    dispatch({ type: 'BUILD_ADD', courseId: id }); setMessage(`${course?.code ?? 'Course'} added to your draft.`)
  }
  const remove = (id: string) => {
    const course = demoData.courses.find((item) => item.id === id)
    dispatch({ type: 'BUILD_REMOVE', courseId: id }); setMessage(`${course?.code ?? 'Course'} removed from your draft.`)
  }
  return <div className="page-wrap">
    <PageHeader eyebrow="SEMESTER PLANNER" title="Build your semester" subtitle="Add your courses to see a projected workload for the term." actions={<span className="step-indicator"><i /> Plan draft</span>} />
    <div className="build-layout">
      <section className="build-discovery">
        <CourseFilters {...{ query, setQuery, group, setGroup, level, setLevel, sort, setSort }} />
        <div className="card suggestion-card">
          <div className="section-title-row"><div><h2>{isFiltering ? 'Catalog results' : 'Suggested courses'}</h2><p>{isFiltering ? `${filtered.length} matching demo course${filtered.length === 1 ? '' : 's'}` : 'A few illustrative options not already in your draft.'}</p></div>{!isFiltering && <button className="text-button" type="button" onClick={() => setPickerOpen(true)}>See all</button>}</div>
          <CatalogGrid courses={isFiltering ? filtered : suggested} selectedIds={state.buildDraftCourseIds} onAdd={add} />
        </div>
        <DemoNotice compact />
      </section>
      <aside className="build-summary card">
        <div className="section-title-row"><div><h2>Your courses</h2><p>Draft — changes apply when analyzed</p></div><strong>{state.buildDraftCourseIds.length} courses · {metrics.units} units</strong></div>
        <CourseList courseIds={state.buildDraftCourseIds} origin="build" onRemove={remove} />
        {draftDiffers && <button type="button" className="text-button reset-draft" onClick={() => dispatch({ type: 'BUILD_RESET' })}><RotateCcw /> Reset draft to current plan</button>}
        <div className="build-actions"><button className="button secondary" type="button" onClick={() => setPickerOpen(true)}><Plus /> Add course</button><button className="button primary" type="button" disabled={!state.buildDraftCourseIds.length} onClick={() => { dispatch({ type: 'BUILD_ANALYZE' }); navigate('/overview') }}>Analyze my workload <ArrowRight /></button></div>
        {!state.buildDraftCourseIds.length && <p className="field-error">Add at least one course before analyzing.</p>}
      </aside>
    </div>
    {message && <div className="toast" role="status">{message}<button type="button" onClick={() => setMessage('')}>Dismiss</button></div>}
    <CoursePicker open={pickerOpen} onClose={() => setPickerOpen(false)} selectedIds={state.buildDraftCourseIds} onAdd={add} />
  </div>
}
