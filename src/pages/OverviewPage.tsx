import { useState } from 'react'
import { ArrowRight, CalendarRange } from 'lucide-react'
import { Link } from 'react-router-dom'
import { planMetrics, formatHours, weekBreakdown } from '../domain/calculations'
import { demoData, courseMap } from '../domain/data'
import { weekLabel } from '../domain/dates'
import { usePlanner } from '../state/planner'
import { WorkloadChart } from '../components/WorkloadChart'
import { EmptyPlan, MetricCard, PageHeader, WeekBreakdown } from '../components/Shared'

export function OverviewPage() {
  const { state, dispatch } = usePlanner()
  const [allWeeks, setAllWeeks] = useState(false)
  const metrics = planMetrics(state.currentCourseIds, state.weeklyStudyLimitHours)
  if (!state.currentCourseIds.length) return <div className="page-wrap"><PageHeader eyebrow="FALL 2026" title="Your Fall Semester" subtitle="Projected weekly study workload for your selected courses" /><EmptyPlan /></div>
  return <div className="page-wrap">
    <PageHeader eyebrow="FALL 2026" title="Your Fall Semester" subtitle="Projected weekly study workload for your selected courses" actions={<div className="header-metrics"><MetricCard label="Semester study" value={`${formatHours(metrics.totalStudyHours)} hrs`} /><MetricCard label="Peak week" value={`${formatHours(metrics.peakHours)} hrs`} detail={`Week ${metrics.peakWeeks.join(', ')}`} tone="brand" /></div>} />
    <div className="overview-layout">
      <div className="overview-main">
        <section className="card chart-card"><div className="section-title-row"><div><h2>Weekly study workload</h2><p>15 illustrative semester weeks · stacked by course</p></div><span className="study-limit-label">Study limit: {formatHours(state.weeklyStudyLimitHours)} hrs/week</span></div>
          <WorkloadChart courseIds={state.currentCourseIds} selectedWeek={state.selectedWeek} threshold={state.weeklyStudyLimitHours} onSelectWeek={(week) => dispatch({ type: 'SELECT_WEEK', week })} showTable={false} />
        </section>
      </div>
      <aside className="overview-side card"><WeekBreakdown courseIds={state.currentCourseIds} week={state.selectedWeek} threshold={state.weeklyStudyLimitHours} onWeekChange={(week) => dispatch({ type: 'SELECT_WEEK', week })} />
        <div className="side-actions"><button className="button secondary" type="button" onClick={() => setAllWeeks((open) => !open)}><CalendarRange /> {allWeeks ? 'Hide all weeks' : 'View all weeks'}</button><Link className="button primary" to="/adjust">Adjust my courses <ArrowRight /></Link></div>
      </aside>
    </div>
    {allWeeks && <section className="card all-weeks-card"><div className="section-title-row"><div><p className="eyebrow">ALL 15 WEEKS</p><h2>Semester workload table</h2></div></div><div className="table-scroll"><table><thead><tr><th>Week</th><th>Date range</th>{state.currentCourseIds.map((id) => <th key={id}>{courseMap.get(id)?.code}</th>)}<th>Total</th><th>Status</th></tr></thead><tbody>{demoData.term.weeks.map((week) => <tr key={week.week}><th><button className="table-week-button" type="button" onClick={() => dispatch({ type: 'SELECT_WEEK', week: week.week })}>Week {week.week}</button></th><td>{weekLabel(week.week)}</td>{weekBreakdown(state.currentCourseIds, week.week).map((item) => <td key={item.courseId}>{formatHours(item.totalHours)} hrs</td>)}<td><strong>{formatHours(metrics.weeklyTotals[week.week - 1]!)} hrs</strong></td><td>{metrics.weeklyTotals[week.week - 1]! > state.weeklyStudyLimitHours ? 'ABOVE LIMIT' : 'Within limit'}</td></tr>)}</tbody></table></div></section>}
  </div>
}
