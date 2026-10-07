import { AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { courseMap, demoData } from '../domain/data'
import { assessmentKindLabel, formatHours, planMetrics, weekBreakdown } from '../domain/calculations'
import { formatDate, weekLabel } from '../domain/dates'
import { CourseDot } from './Courses'

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow: string; title: string; subtitle: string; actions?: React.ReactNode }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-subtitle">{subtitle}</p></div>{actions && <div className="page-actions">{actions}</div>}</div>
}

export function DemoNotice({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? 'demo-notice compact' : 'demo-notice'}><Info aria-hidden="true" /><p><strong>Demo data</strong> This prototype uses illustrative courses, dates, and workload estimates. It is not connected to USC registration and does not verify degree requirements.</p></div>
}

export function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail?: string; tone?: 'brand' | 'warning' | 'success' }) {
  return <article className={`metric-card ${tone ?? ''}`}><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</article>
}

export function WeekBreakdown({ courseIds, week, threshold, onWeekChange, linkCourses = true }: { courseIds: string[]; week: number; threshold?: number; onWeekChange?: (week: number) => void; linkCourses?: boolean }) {
  const rows = weekBreakdown(courseIds, week)
  const total = rows.reduce((sum, row) => sum + row.totalHours, 0)
  const aboveLimit = threshold != null && total > threshold
  return <section className={aboveLimit ? 'week-breakdown above-limit' : 'week-breakdown'} data-testid="week-breakdown">
    <div className="section-title-row"><div><p className="eyebrow">WHY THIS WEEK IS {aboveLimit ? 'HIGH' : 'AT THIS LEVEL'}</p><h2>Week {week} breakdown</h2><p>{weekLabel(week)}</p></div><div className="week-total"><strong>{formatHours(total)} hrs</strong>{threshold != null && <span className={aboveLimit ? 'week-status above' : 'week-status'}>{aboveLimit ? 'ABOVE LIMIT' : 'Within limit'}</span>}</div></div>
    {onWeekChange && <div className="week-nav"><button type="button" disabled={week <= 1} onClick={() => onWeekChange(week - 1)} aria-label="Previous week"><ChevronLeft /></button><span>Week {week} of 15</span><button type="button" disabled={week >= 15} onClick={() => onWeekChange(week + 1)} aria-label="Next week"><ChevronRight /></button></div>}
    {rows.length ? <ul className="breakdown-list">{rows.map((row) => {
      const course = courseMap.get(row.courseId)!
      const assessments = row.assessmentIds.map((id) => demoData.assessments.find((item) => item.id === id)).filter((item) => item != null)
      return <li key={row.courseId}><CourseDot color={course.color} /><div>
        <div className="breakdown-primary"><div className="breakdown-course">{linkCourses ? <Link to={`/courses/${course.id}?origin=current`}>{course.code}</Link> : <strong>{course.code}</strong>}<span>{course.title}</span></div><strong>{formatHours(row.totalHours)} hrs</strong></div>
        <p className="recurring-hours">{formatHours(row.recurringHours)} hrs recurring study</p>
        {assessments.length ? <ul className="breakdown-assessments">{assessments.map((item) => <li key={item.id}><strong>{assessmentKindLabel(item.kind)} · {item.title}</strong><span>Due {formatDate(item.dueDate, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatHours(item.additionalStudyHours)} hrs extra</span></li>)}</ul> : <p className="no-deadline">No illustrative assessment deadline this week.</p>}
      </div></li>
    })}</ul> : <div className="empty-inline"><span>No courses contribute to this week.</span></div>}
    <p className="breakdown-note">Workload estimates include recurring study plus extra assessment preparation outside scheduled class meetings.</p>
  </section>
}

export function OverloadNotice({ courseIds, threshold, onSelect }: { courseIds: string[]; threshold: number; onSelect?: (week: number) => void }) {
  const metrics = planMetrics(courseIds, threshold)
  if (!courseIds.length) return null
  if (!metrics.highWorkloadWeeks.length) return <div className="overload-notice neutral"><Info /><div><strong>No modeled weeks exceed {formatHours(threshold)} hrs</strong><p>This estimate is only one input to your academic planning.</p></div></div>
  return <div className="overload-notice"><AlertTriangle /><div><strong>{metrics.highWorkloadWeeks.length} high-workload week{metrics.highWorkloadWeeks.length === 1 ? '' : 's'} detected</strong><p>{metrics.highWorkloadWeeks.map((highWeek, index) => <span key={highWeek}>{index > 0 && ', '}<button type="button" onClick={() => onSelect?.(highWeek)}>Week {highWeek} ({formatHours(metrics.weeklyTotals[highWeek - 1]!)} hrs)</button></span>)} exceed your {formatHours(threshold)} hrs/week limit.</p></div></div>
}

export function EmptyPlan({ actionTo = '/build' }: { actionTo?: string }) {
  return <div className="empty-state"><span className="empty-icon" aria-hidden="true">＋</span><h2>Start with a few courses</h2><p>Add courses to see how study and assessment demands overlap across the semester.</p><Link className="button primary" to={actionTo}>Add courses <ArrowRight /></Link></div>
}
