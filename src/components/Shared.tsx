import { AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { courseMap, demoData } from '../domain/data'
import { formatHours, planMetrics, weekBreakdown } from '../domain/calculations'
import { weekLabel } from '../domain/dates'
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

export function WeekBreakdown({ courseIds, week, onWeekChange, linkCourses = true }: { courseIds: string[]; week: number; onWeekChange?: (week: number) => void; linkCourses?: boolean }) {
  const rows = weekBreakdown(courseIds, week)
  const total = rows.reduce((sum, row) => sum + row.totalHours, 0)
  return <section className="week-breakdown">
    <div className="section-title-row"><div><p className="eyebrow">SELECTED WEEK</p><h2>Week {week} breakdown</h2><p>{weekLabel(week)}</p></div><strong>{formatHours(total)} h</strong></div>
    {onWeekChange && <div className="week-nav"><button type="button" disabled={week <= 1} onClick={() => onWeekChange(week - 1)} aria-label="Previous week"><ChevronLeft /></button><span>Week {week} of 15</span><button type="button" disabled={week >= 15} onClick={() => onWeekChange(week + 1)} aria-label="Next week"><ChevronRight /></button></div>}
    {rows.length ? <ul className="breakdown-list">{rows.map((row) => {
      const course = courseMap.get(row.courseId)!
      const assessments = row.assessmentIds.map((id) => demoData.assessments.find((item) => item.id === id)).filter(Boolean)
      return <li key={row.courseId}><CourseDot color={course.color} /><div><div className="breakdown-primary">{linkCourses ? <Link to={`/courses/${course.id}?origin=current`}>{course.code}</Link> : <strong>{course.code}</strong>}<strong>{formatHours(row.totalHours)} h</strong></div><span>{assessments.length ? assessments.map((item) => item!.title).join(' · ') : 'Recurring study'}</span><details><summary>How this adds up</summary><p>{formatHours(row.recurringHours)} h recurring study + {formatHours(row.assessmentHours)} h assessment preparation</p></details></div></li>
    })}</ul> : <div className="empty-inline"><span>No courses contribute to this week.</span></div>}
    <p className="breakdown-note">Hours estimate study and assessment work outside scheduled class meetings.</p>
  </section>
}

export function OverloadNotice({ courseIds, threshold, onSelect }: { courseIds: string[]; threshold: number; onSelect?: (week: number) => void }) {
  const metrics = planMetrics(courseIds, threshold)
  if (!courseIds.length) return null
  if (!metrics.highWorkloadWeeks.length) return <div className="overload-notice neutral"><Info /><div><strong>No modeled weeks exceed {formatHours(threshold)} hours</strong><p>This estimate is only one input to your academic planning.</p></div></div>
  return <div className="overload-notice"><AlertTriangle /><div><strong>{metrics.highWorkloadWeeks.length} high-workload week{metrics.highWorkloadWeeks.length === 1 ? '' : 's'} detected</strong><p>{metrics.highWorkloadWeeks.map((week, index) => <span key={week}>{index > 0 && ', '}<button type="button" onClick={() => onSelect?.(week)}>Week {week} ({metrics.weeklyTotals[week - 1]} h)</button></span>)} exceed your {formatHours(threshold)}-hour limit.</p></div></div>
}

export function EmptyPlan({ actionTo = '/build' }: { actionTo?: string }) {
  return <div className="empty-state"><span className="empty-icon" aria-hidden="true">＋</span><h2>Start with a few courses</h2><p>Add courses to see how study and assessment demands overlap across the semester.</p><Link className="button primary" to={actionTo}>Add courses <ArrowRight /></Link></div>
}
