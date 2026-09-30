import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { courseMap, demoData } from '../domain/data'
import { courseWeekContribution, formatHours, planMetrics } from '../domain/calculations'
import { formatDate, weekLabel } from '../domain/dates'
import { usePlanner } from '../state/planner'
import { WorkloadChart } from '../components/WorkloadChart'
import { CourseDot } from '../components/Courses'
import { DemoNotice, MetricCard } from '../components/Shared'

const tabs = ['workload', 'syllabus', 'details'] as const
type Tab = typeof tabs[number]

export function CoursePage() {
  const { courseId } = useParams()
  const course = courseId ? courseMap.get(courseId) : undefined
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { state, dispatch } = usePlanner()
  if (!course) return <div className="page-wrap not-found"><p className="eyebrow">COURSE NOT FOUND</p><h1>That demo course isn’t available</h1><p>Its ID may be invalid or from an older saved plan.</p><Link className="button primary" to="/build">Browse demo courses</Link></div>
  const requested = params.get('tab') as Tab | null
  const tab: Tab = tabs.includes(requested as Tab) ? requested as Tab : 'workload'
  const origin = ['build', 'adjust', 'current'].includes(params.get('origin') ?? '') ? params.get('origin')! : 'current'
  const selected = origin === 'build' ? state.buildDraftCourseIds.includes(course.id) : origin === 'adjust' ? Boolean(state.comparison?.draftCourseIds.includes(course.id)) : state.currentCourseIds.includes(course.id)
  const setTab = (next: Tab) => { const updated = new URLSearchParams(params); updated.set('tab', next); setParams(updated) }
  const action = () => {
    if (origin === 'build') dispatch({ type: selected ? 'BUILD_REMOVE' : 'BUILD_ADD', courseId: course.id })
    else if (origin === 'adjust') dispatch({ type: selected ? 'COMPARISON_REMOVE' : 'COMPARISON_ADD', courseId: course.id })
  }
  const metrics = planMetrics([course.id])
  const selectedWeek = state.selectedWeek
  const contribution = courseWeekContribution(course.id, selectedWeek)
  return <div className="page-wrap course-page">
    <button className="back-button" type="button" onClick={() => navigate(-1)}><ArrowLeft /> Back</button>
    <div className="course-hero"><div><div className="course-code-line"><CourseDot color={course.color} /><p className="eyebrow">{course.code} · {course.units} UNITS · DEMO DATA</p></div><h1>{course.title}</h1><p>{course.description}</p></div>{origin === 'current' ? <Link className="button secondary" to="/build">Edit in Build <ArrowRight /></Link> : <button className={selected ? 'button secondary' : 'button primary'} type="button" onClick={action}>{selected ? <><Trash2 /> Remove from {origin === 'build' ? 'draft' : 'scenario'}</> : <><Plus /> Add to {origin === 'build' ? 'draft' : 'scenario'}</>}</button>}</div>
    <div className="course-tabs" role="tablist" aria-label="Course information">{tabs.map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item[0]!.toUpperCase() + item.slice(1)}</button>)}</div>
    {tab === 'workload' && <section className="course-tab-panel" role="tabpanel"><div className="metric-grid three"><MetricCard label="Average week" value={`${formatHours(metrics.averageWeeklyStudyHours)} h`} /><MetricCard label="Course peak" value={`${formatHours(metrics.peakHours)} h`} detail={`Week ${metrics.peakWeeks.join(', ')}`} tone="brand" /><MetricCard label={`Week ${selectedWeek}`} value={`${formatHours(contribution.totalHours)} h`} detail={`${contribution.recurringHours} recurring + ${contribution.assessmentHours} extra`} /></div><div className="card chart-card"><div className="section-title-row"><div><h2>Projected course workload</h2><p>Recurring study plus illustrative assessment preparation.</p></div></div><WorkloadChart courseIds={[course.id]} selectedWeek={selectedWeek} onSelectWeek={(week) => dispatch({ type: 'SELECT_WEEK', week })} /></div><div className="card course-week-detail"><div><p className="eyebrow">SELECTED</p><h2>Week {selectedWeek} · {weekLabel(selectedWeek)}</h2></div><strong>{formatHours(contribution.totalHours)} h total</strong><p>{formatHours(contribution.recurringHours)} hours recurring study + {formatHours(contribution.assessmentHours)} hours of assessment preparation.</p></div></section>}
    {tab === 'syllabus' && <section className="course-tab-panel card syllabus-panel" role="tabpanel"><div><p className="eyebrow">ILLUSTRATIVE DOCUMENT</p><h2>Sample syllabus</h2><p>{course.sampleSyllabusOverview}</p></div><div className="syllabus-list">{demoData.assessments.filter((item) => item.courseId === course.id).map((item) => <article key={item.id}><span>Week {item.week}</span><div><h3>{item.title}</h3><p>{formatDate(item.dueDate, { weekday: 'short', month: 'long', day: 'numeric' })} · {item.kind} · {formatHours(item.additionalStudyHours)} h extra study</p></div></article>)}</div></section>}
    {tab === 'details' && <section className="course-tab-panel details-grid" role="tabpanel"><div className="card"><p className="eyebrow">COURSE DETAILS</p><h2>{course.code}</h2><dl><div><dt>Title</dt><dd>{course.title}</dd></div><div><dt>Units</dt><dd>{course.units}</dd></div><div><dt>Sample section</dt><dd>{course.sectionLabel}</dd></div><div><dt>Meeting pattern</dt><dd>{course.meetingPattern}</dd></div><div><dt>Catalog grouping</dt><dd>{course.catalogGroup.replace('-', ' ')}</dd></div></dl></div><div className="card trust-card"><p className="eyebrow">SOURCE LIMITATION</p><h2>Illustrative only</h2><p>{course.sourceLabel}. Course-code/title pairings, term availability, prerequisite details, and requirement eligibility have not been verified.</p><p><Check /> No real instructor or registration status is represented.</p></div></section>}
    <DemoNotice />
  </div>
}
