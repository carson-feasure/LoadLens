import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, FlaskConical } from 'lucide-react'
import { Link } from 'react-router-dom'
import { comparisonMetrics, formatHours, planMetrics } from '../domain/calculations'
import { courseMap, planA, planB } from '../domain/data'
import { usePlanner } from '../state/planner'
import { WorkloadChart } from '../components/WorkloadChart'
import { CourseDot } from '../components/Courses'

type Choice = 'plan-a' | 'plan-b'

export function StudyPage() {
  const { dispatch } = usePlanner()
  const [step, setStep] = useState(1)
  const [initialChoice, setInitialChoice] = useState<Choice | null>(null)
  const [highRiskPlan, setHighRiskPlan] = useState<Choice | null>(null)
  const [demandingWeeks, setDemandingWeeks] = useState<number[]>([])
  const [finalChoice, setFinalChoice] = useState<Choice | null>(null)
  const [reason, setReason] = useState('')
  const comparison = comparisonMetrics(planA.courseIds, planB.courseIds, 20)
  const save = () => {
    if (!initialChoice || !highRiskPlan || !finalChoice || !reason.trim()) return
    dispatch({ type: 'STUDY_SAVE', session: { id: crypto.randomUUID(), createdAt: new Date().toISOString(), initialChoice, highRiskPlan, demandingWeeks: [...demandingWeeks].sort((a, b) => a - b), finalChoice, reason: reason.trim() } })
    setStep(4)
  }
  const restart = () => { setStep(1); setInitialChoice(null); setHighRiskPlan(null); setDemandingWeeks([]); setFinalChoice(null); setReason('') }
  return <div className="page-wrap study-page">
    <div className="study-header"><div><p className="eyebrow">OPTIONAL PROTOTYPE STUDY</p><h1>Does workload visibility affect your plan?</h1><p>This four-step flow captures a local response using two prepared, illustrative plans. It does not test forecast accuracy.</p></div><FlaskConical /></div>
    <div className="study-progress" aria-label={`Step ${step} of 4`}>{[1, 2, 3, 4].map((number) => <span key={number} className={number <= step ? 'active' : ''}><i>{number}</i><em>{['Choose', 'Compare', 'Decide', 'Saved'][number - 1]}</em></span>)}</div>
    {step === 1 && <section className="study-panel"><div className="study-intro"><p className="eyebrow">STEP 1 · INITIAL CHOICE</p><h2>Choose using schedule information only</h2><p>Workload charts are intentionally hidden on this step.</p></div><div className="study-plan-grid"><StudyPlanCard choice="plan-a" selected={initialChoice === 'plan-a'} onSelect={setInitialChoice} /><StudyPlanCard choice="plan-b" selected={initialChoice === 'plan-b'} onSelect={setInitialChoice} /></div><div className="study-actions"><span /><button className="button primary" type="button" disabled={!initialChoice} onClick={() => setStep(2)}>Inspect workload <ArrowRight /></button></div></section>}
    {step === 2 && <section className="study-panel"><div className="study-intro"><p className="eyebrow">STEP 2 · INSPECT WORKLOAD</p><h2>Compare the 15-week patterns</h2><p>Use the same scale on both charts, then record your own interpretation.</p></div><div className="study-chart-grid"><StudyChart choice="plan-a" yMax={comparison.sharedYAxisMax} /><StudyChart choice="plan-b" yMax={comparison.sharedYAxisMax} /></div><fieldset className="study-question"><legend>Which plan has the higher peak workload?</legend><div className="choice-row"><ChoiceButton label="Plan A" selected={highRiskPlan === 'plan-a'} onClick={() => setHighRiskPlan('plan-a')} /><ChoiceButton label="Plan B" selected={highRiskPlan === 'plan-b'} onClick={() => setHighRiskPlan('plan-b')} /></div></fieldset><fieldset className="study-question"><legend>Which weeks seem most demanding? <span>Select one or more</span></legend><div className="week-check-grid">{Array.from({ length: 15 }, (_, index) => index + 1).map((week) => <label key={week}><input type="checkbox" checked={demandingWeeks.includes(week)} onChange={() => setDemandingWeeks((items) => items.includes(week) ? items.filter((item) => item !== week) : [...items, week])} />W{week}</label>)}</div></fieldset><div className="study-actions"><button className="button secondary" type="button" onClick={() => setStep(1)}><ArrowLeft /> Back</button><button className="button primary" type="button" disabled={!highRiskPlan || !demandingWeeks.length} onClick={() => setStep(3)}>Continue <ArrowRight /></button></div></section>}
    {step === 3 && <section className="study-panel narrow"><div className="study-intro"><p className="eyebrow">STEP 3 · FINAL CHOICE</p><h2>Choose a plan and explain why</h2><p>Keeping or changing your initial choice are both valid outcomes.</p></div><fieldset className="study-question"><legend>Final plan</legend><div className="choice-row"><ChoiceButton label="Plan A" selected={finalChoice === 'plan-a'} onClick={() => setFinalChoice('plan-a')} /><ChoiceButton label="Plan B" selected={finalChoice === 'plan-b'} onClick={() => setFinalChoice('plan-b')} /></div></fieldset><label className="field-label" htmlFor="study-reason">What influenced your decision?</label><textarea id="study-reason" rows={5} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Describe what mattered to you…" /><p className="field-help">Required. A researcher reviews the response; the app does not score keywords.</p><div className="study-actions"><button className="button secondary" type="button" onClick={() => setStep(2)}><ArrowLeft /> Back</button><button className="button primary" type="button" disabled={!finalChoice || !reason.trim()} onClick={save}>Save local response <ArrowRight /></button></div></section>}
    {step === 4 && <section className="study-panel study-confirmation"><CheckCircle2 /><p className="eyebrow">RESPONSE SAVED LOCALLY</p><h2>Thank you</h2><p>Your anonymous response is saved on this browser only. It did not change the current semester plan.</p><div><Link className="button primary" to="/dashboard">Return to dashboard</Link><button className="button secondary" type="button" onClick={restart}>Start another local session</button></div></section>}
    <p className="study-disclosure">Illustrative courses and estimates only. No names, student IDs, emails, or account credentials are collected.</p>
  </div>
}

function StudyPlanCard({ choice, selected, onSelect }: { choice: Choice; selected: boolean; onSelect: (choice: Choice) => void }) {
  const plan = choice === 'plan-a' ? planA : planB
  return <button type="button" className={selected ? 'study-plan selected' : 'study-plan'} onClick={() => onSelect(choice)}><span className="study-plan-check">{selected && <CheckCircle2 />}</span><p className="eyebrow">{plan.name}</p><h3>{plan.courseIds.length} courses · {planMetrics(plan.courseIds).units} units</h3><ul>{plan.courseIds.map((id) => { const course = courseMap.get(id)!; return <li key={id}><CourseDot color={course.color} /><div><strong>{course.code}</strong><span>{course.meetingPattern}</span></div></li> })}</ul></button>
}

function StudyChart({ choice, yMax }: { choice: Choice; yMax: number }) {
  const plan = choice === 'plan-a' ? planA : planB
  const metrics = planMetrics(plan.courseIds, 20)
  return <article className="card mini-chart-card"><div className="section-title-row"><div><p className="eyebrow">{plan.name}</p><h3>{metrics.units} units</h3></div><strong>Peak {formatHours(metrics.peakHours)} h</strong></div><WorkloadChart courseIds={plan.courseIds} compact yMax={yMax} showTable={false} /></article>
}

function ChoiceButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) { return <button type="button" className={selected ? 'choice-button selected' : 'choice-button'} aria-pressed={selected} onClick={onClick}>{selected && <CheckCircle2 />}{label}</button> }
