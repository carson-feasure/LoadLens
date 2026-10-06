import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowRight, Plus, RotateCcw, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { comparisonMetrics, formatHours } from '../domain/calculations'
import { courseMap } from '../domain/data'
import { usePlanner } from '../state/planner'
import { CourseDot, CourseList, CoursePicker } from '../components/Courses'
import { Modal } from '../components/Dialogs'
import { PageHeader } from '../components/Shared'
import { WorkloadChart } from '../components/WorkloadChart'

export function AdjustPage() {
  const { state, dispatch } = usePlanner()
  const navigate = useNavigate()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [decision, setDecision] = useState<'keep' | 'apply' | null>(null)
  useEffect(() => { dispatch({ type: 'COMPARISON_INIT' }) }, [dispatch, state.currentPlanRevision])
  const comparison = state.comparison
  if (!comparison) return <div className="page-wrap"><PageHeader eyebrow="SCENARIO PLANNER" title="Adjust Your Semester" subtitle="Preparing your current plan comparison…" /></div>
  const metrics = comparisonMetrics(comparison.baselineCourseIds, comparison.draftCourseIds, state.weeklyStudyLimitHours)
  const unchanged = !metrics.addedCourseIds.length && !metrics.removedCourseIds.length
  const tone = metrics.peakReductionHours > 0 ? 'improved' : metrics.peakReductionHours < 0 ? 'increased' : 'neutral'
  const deltaText = metrics.peakReductionHours > 0 ? `${formatHours(metrics.peakReductionHours)} fewer hrs at the new peak` : metrics.peakReductionHours < 0 ? `Peak increases by ${formatHours(Math.abs(metrics.peakReductionHours))} hrs` : 'Peak workload is unchanged'
  return <div className="page-wrap adjust-page">
    <PageHeader eyebrow="SCENARIO PLANNER" title="Adjust Your Semester" subtitle="See how a separate proposed plan changes your modeled workload." actions={<div className="scenario-hint"><span aria-hidden="true">?</span><div><strong>Try a real comparison</strong><small>Current stays unchanged until you apply.</small></div></div>} />
    <div className="example-callout"><ArrowDownRight /><div><strong>{metrics.removedCourseIds[0] === 'writ-150' && metrics.addedCourseIds[0] === 'ise-105' ? 'Example comparison: WRIT 150 → ISE 105' : 'Your proposed comparison'}</strong><span>A swap is not proof of academic equivalence. Check actual requirements before registration.</span></div></div>
    <div className="comparison-columns">
      <section className="card comparison-card"><div className="section-title-row"><div><p className="eyebrow">BASELINE</p><h2>Current</h2></div><strong>{metrics.current.units} units</strong></div><CourseList courseIds={comparison.baselineCourseIds} origin="current" changed={{ removed: metrics.removedCourseIds }} /></section>
      <section className="card comparison-card"><div className="section-title-row"><div><p className="eyebrow">SCENARIO DRAFT</p><h2>Updated</h2></div><strong>{metrics.updated.units} units</strong></div>
        <ul className="course-list">{comparison.draftCourseIds.map((id) => { const course = courseMap.get(id)!; return <li key={id}><CourseDot color={course.color} /><div className="course-row-main"><a href={`#/courses/${id}?origin=adjust`}>{course.code}</a><span>{course.title}</span>{metrics.addedCourseIds.includes(id) && <small>Added</small>}</div><span className="course-units">{course.units} units</span><select className="replace-select" aria-label={`Replace ${course.code}`} value="" onChange={(event) => { if (event.target.value) dispatch({ type: 'COMPARISON_REPLACE', oldId: id, newId: event.target.value }) }}><option value="">Replace…</option>{[...courseMap.values()].filter((item) => !comparison.draftCourseIds.includes(item.id)).map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select><button type="button" className="remove-course" onClick={() => dispatch({ type: 'COMPARISON_REMOVE', courseId: id })} aria-label={`Remove ${course.code}`}>×</button></li> })}</ul>
        <div className="comparison-edit-actions"><button className="button secondary" type="button" onClick={() => setPickerOpen(true)}><Plus /> Add course</button><button className="text-button" type="button" onClick={() => dispatch({ type: 'COMPARISON_RESET' })}><RotateCcw /> Reset comparison</button></div>
      </section>
    </div>
    <div className="comparison-columns chart-comparison">
      <section className="card mini-chart-card"><div className="section-title-row"><div><h2>Current workload</h2><p>Peak Week {metrics.current.peakWeeks.join(', ')}</p></div><strong>{formatHours(metrics.current.peakHours)} hrs</strong></div><WorkloadChart courseIds={comparison.baselineCourseIds} selectedWeek={state.selectedWeek} threshold={state.weeklyStudyLimitHours} compact yMax={metrics.sharedYAxisMax} showTable={false} /><p className="mini-chart-meta">{metrics.current.highWorkloadWeeks.length} above-limit week{metrics.current.highWorkloadWeeks.length === 1 ? '' : 's'} · {metrics.current.totalStudyHours} semester hrs</p></section>
      <section className="card mini-chart-card"><div className="section-title-row"><div><h2>Updated workload</h2><p>Peak Week {metrics.updated.peakWeeks.join(', ') || '—'}</p></div><strong>{formatHours(metrics.updated.peakHours)} hrs</strong></div><WorkloadChart courseIds={comparison.draftCourseIds} selectedWeek={state.selectedWeek} threshold={state.weeklyStudyLimitHours} compact yMax={metrics.sharedYAxisMax} showTable={false} /><p className="mini-chart-meta">{metrics.updated.highWorkloadWeeks.length} above-limit week{metrics.updated.highWorkloadWeeks.length === 1 ? '' : 's'} · {metrics.updated.totalStudyHours} semester hrs</p></section>
    </div>
    <div className={`comparison-result ${tone}`}>{tone === 'improved' ? <TrendingDown /> : tone === 'increased' ? <TrendingUp /> : <ShieldAlert />}<div><strong>{deltaText}</strong><span>{formatHours(Math.abs(metrics.reductionAtOriginalPeakHours))} {metrics.reductionAtOriginalPeakHours >= 0 ? 'fewer' : 'more'} hrs in the original Week {metrics.current.peakWeeks[0] ?? 1} peak · {Math.abs(metrics.overloadedWeekReduction)} {metrics.overloadedWeekReduction >= 0 ? 'fewer' : 'more'} above-limit weeks · {Math.abs(metrics.totalStudyHourReduction)} {metrics.totalStudyHourReduction >= 0 ? 'fewer' : 'more'} semester hrs</span></div></div>
    {!comparison.draftCourseIds.length && <div className="warning-inline"><ShieldAlert /> The proposed plan is empty. You’ll be asked to confirm before applying it.</div>}
    <div className="comparison-actions"><button className="button secondary" type="button" onClick={() => setDecision('keep')}>Keep current</button><button className="button primary" type="button" disabled={unchanged} title={unchanged ? 'Make a change before applying' : undefined} onClick={() => setDecision('apply')}>Use new schedule <ArrowRight /></button></div>
    <p className="comparison-disclaimer">Example only. Check degree requirements before making real registration changes.</p>
    <CoursePicker open={pickerOpen} onClose={() => setPickerOpen(false)} selectedIds={comparison.draftCourseIds} onAdd={(courseId) => dispatch({ type: 'COMPARISON_ADD', courseId })} title="Add to updated plan" />
    <DecisionDialog open={decision !== null} type={decision ?? 'keep'} empty={comparison.draftCourseIds.length === 0} onClose={() => setDecision(null)} onConfirm={() => { if (decision === 'apply') { dispatch({ type: 'COMPARISON_APPLY' }); navigate('/overview') } else { dispatch({ type: 'COMPARISON_KEEP' }); navigate('/overview') } }} />
  </div>
}

function DecisionDialog({ open, type, empty, onClose, onConfirm }: { open: boolean; type: 'keep' | 'apply'; empty: boolean; onClose: () => void; onConfirm: () => void }) {
  const [reason, setReason] = useState('')
  return <Modal open={open} onClose={onClose} title={type === 'apply' ? 'Use this proposed plan?' : 'Keep your current plan?'}>
    <p className="muted">You can optionally note what mattered in your choice. This stays on this browser.</p>
    {empty && type === 'apply' && <p className="warning-inline">This will apply an empty current plan.</p>}
    <label className="field-label" htmlFor="decision-reason">Reason (optional)</label><textarea id="decision-reason" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="What influenced your choice?" />
    <div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="button" onClick={onConfirm}>{reason ? 'Save choice' : 'Skip reason'}</button></div>
  </Modal>
}
