import { useState } from 'react'
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Edit3, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { demoData, courseMap } from '../domain/data'
import { datesForWeek, formatDate, weekLabel } from '../domain/dates'
import { averageCourseHours, formatHours, planMetrics, workloadLevel } from '../domain/calculations'
import { usePlanner } from '../state/planner'
import { WorkloadChart } from '../components/WorkloadChart'
import { PreferencesDialog } from '../components/Dialogs'
import { DemoNotice, EmptyPlan, MetricCard, PageHeader, WeekBreakdown } from '../components/Shared'
import { CourseDot } from '../components/Courses'

export function DashboardPage() {
  const { state, dispatch } = usePlanner()
  const [prefsOpen, setPrefsOpen] = useState(false)
  const metrics = planMetrics(state.currentCourseIds, state.weeklyStudyLimitHours)
  const selectWeek = (week: number) => dispatch({ type: 'SELECT_WEEK', week })
  if (!state.currentCourseIds.length) return <div className="page-wrap"><PageHeader eyebrow="SEMESTER DASHBOARD" title="Your semester at a glance" subtitle="Spot demanding weeks before registration." /><DemoNotice /><EmptyPlan /></div>
  return <div className="page-wrap dashboard-page">
    <PageHeader eyebrow="SEMESTER DASHBOARD" title="Your semester at a glance" subtitle="See when study and assessment demands overlap before you register." actions={<Link className="button primary" to="/build"><Edit3 /> Build / Edit my semester</Link>} />
    <div className="dashboard-chips"><span className="term-chip large">Fall 2026</span><span className="demo-badge">Demo data</span></div>
    <div className="metric-grid">
      <MetricCard label="Current plan" value={`${state.currentCourseIds.length} courses`} detail={`${metrics.units} units`} />
      <MetricCard label="Weekly average" value={`${formatHours(metrics.averageWeeklyStudyHours)} hrs`} detail="study and assessment work" />
      <MetricCard label="Peak workload" value={`${formatHours(metrics.peakHours)} hrs`} detail={`Week ${metrics.peakWeeks.join(', ')}`} tone="brand" />
      <MetricCard label="Above your limit" value={`${metrics.highWorkloadWeeks.length} weeks`} detail={`${formatHours(state.weeklyStudyLimitHours)} hrs/week limit`} tone={metrics.highWorkloadWeeks.length ? 'warning' : 'success'} />
    </div>
    <div className="dashboard-layout">
      <div className="dashboard-main">
        <section className="card chart-card" data-testid="dashboard-workload-chart">
          <div className="section-title-row"><div><p className="eyebrow">15-WEEK OUTLOOK</p><h2>Combined workload</h2><p>Select a week to see the work and deadlines driving its total.</p></div><button className="study-limit-edit" type="button" onClick={() => setPrefsOpen(true)}><span>Study limit: {formatHours(state.weeklyStudyLimitHours)} hrs/week</span><Edit3 /></button></div>
          <WorkloadChart courseIds={state.currentCourseIds} selectedWeek={state.selectedWeek} threshold={state.weeklyStudyLimitHours} onSelectWeek={selectWeek} showTable={false} />
          <div className="chart-actions"><Link className="button secondary" to="/overview">Explore workload <ArrowRight /></Link><Link className="button primary" to="/adjust">Compare a change <ArrowRight /></Link></div>
        </section>
      </div>
      <aside className="card dashboard-sidebar"><WeekBreakdown courseIds={state.currentCourseIds} week={state.selectedWeek} threshold={state.weeklyStudyLimitHours} onWeekChange={selectWeek} /></aside>
    </div>
    <ScheduleCard />
    <section className="card my-courses-card"><div className="section-title-row"><div><p className="eyebrow">CURRENT PLAN</p><h2>My courses</h2><p>Compare course format and expected weekly effort at a glance.</p></div><Link className="text-button" to="/build">Edit plan <ArrowRight /></Link></div><div className="dashboard-course-grid">{state.currentCourseIds.map((id) => {
      const course = courseMap.get(id)!
      const level = workloadLevel(course)
      return <article key={id}><CourseDot color={course.color} /><div><Link to={`/courses/${id}?origin=current`}>{course.code}</Link><strong>{course.title}</strong><div className="dashboard-course-meta"><span>{course.units} units</span><span>{course.meetingPattern}</span><span>{formatHours(averageCourseHours(course))} avg hrs/week</span><span className={`workload-level ${level}`}>{level} workload</span></div></div><Link className="syllabus-link" to={`/courses/${id}?tab=syllabus&origin=current`}><FileText /> Sample syllabus</Link></article>
    })}</div></section>
    <DemoNotice />
    <PreferencesDialog open={prefsOpen} onClose={() => setPrefsOpen(false)} />
  </div>
}

function ScheduleCard() {
  const { state, dispatch } = usePlanner()
  const metrics = planMetrics(state.currentCourseIds, state.weeklyStudyLimitHours)
  const weekDates = datesForWeek(state.selectedWeek)
  const weekItems = demoData.assessments.filter((item) => state.currentCourseIds.includes(item.courseId) && item.week === state.selectedWeek)
  const dayItems = weekItems.filter((item) => item.dueDate === state.selectedDate)
  const selectWeek = (week: number) => dispatch({ type: 'SELECT_WEEK', week })
  return <section className="card schedule-card">
    <div className="schedule-head"><div><p className="eyebrow">SCHEDULE VIEWS</p><h2>Semester agenda</h2><p>Deadlines mark when items are due; weekly workload can span multiple days.</p></div><div className="segmented" aria-label="Dashboard schedule view">{(['day', 'week', 'semester'] as const).map((view) => <button type="button" key={view} className={state.dashboardView === view ? 'active' : ''} aria-pressed={state.dashboardView === view} onClick={() => dispatch({ type: 'SET_DASHBOARD_VIEW', view })}>{view[0]!.toUpperCase() + view.slice(1)}</button>)}</div></div>
    {state.dashboardView !== 'semester' && <div className="agenda-nav"><button type="button" disabled={state.selectedWeek <= 1} onClick={() => selectWeek(state.selectedWeek - 1)}><ChevronLeft /> Previous</button><strong>Week {state.selectedWeek} · {weekLabel(state.selectedWeek)} · {formatHours(metrics.weeklyTotals[state.selectedWeek - 1]!)} hrs</strong><button type="button" disabled={state.selectedWeek >= 15} onClick={() => selectWeek(state.selectedWeek + 1)}>Next <ChevronRight /></button></div>}
    {state.dashboardView === 'semester' && <div className="semester-grid">{demoData.term.weeks.map((week) => { const total = metrics.weeklyTotals[week.week - 1]!; const due = demoData.assessments.filter((item) => state.currentCourseIds.includes(item.courseId) && item.week === week.week); return <button type="button" className={state.selectedWeek === week.week ? 'week-card selected' : 'week-card'} key={week.week} onClick={() => selectWeek(week.week)}><span>Week {week.week}</span><small>{weekLabel(week.week)}</small><strong>{formatHours(total)} hrs</strong><em className={total > state.weeklyStudyLimitHours ? 'above' : ''}>{total > state.weeklyStudyLimitHours ? 'ABOVE LIMIT' : `${due.length} deadline${due.length === 1 ? '' : 's'}`}</em></button> })}</div>}
    {state.dashboardView === 'week' && <div className="week-agenda">{weekDates.map((date) => { const items = weekItems.filter((item) => item.dueDate === date); return <section key={date}><h3>{formatDate(date, { weekday: 'long', month: 'short', day: 'numeric' })}</h3>{items.length ? <ul>{items.map((item) => <li key={item.id}><CourseDot color={courseMap.get(item.courseId)!.color} /><div><strong>{item.title}</strong><span>{courseMap.get(item.courseId)!.code} · {item.kind} · {formatHours(item.additionalStudyHours)} hrs extra prep</span></div></li>)}</ul> : <p>No sample deadlines</p>}</section>})}</div>}
    {state.dashboardView === 'day' && <div className="day-agenda"><div className="day-picker">{weekDates.map((date) => <button type="button" key={date} className={state.selectedDate === date ? 'active' : ''} onClick={() => dispatch({ type: 'SELECT_DATE', date })}><span>{formatDate(date, { weekday: 'short' })}</span><strong>{formatDate(date, { day: 'numeric' })}</strong></button>)}</div><div className="day-items"><h3>{formatDate(state.selectedDate, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>{dayItems.length ? <ul>{dayItems.map((item) => <li key={item.id}><CalendarDays /><div><strong>{item.title}</strong><span>{courseMap.get(item.courseId)!.code} · due today</span></div></li>)}</ul> : <div className="empty-state compact"><CalendarDays /><strong>No sample due items</strong><span>Recurring study workload is not shown as fake calendar appointments.</span></div>}</div></div>}
  </section>
}
