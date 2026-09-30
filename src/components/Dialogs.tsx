import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { usePlanner } from '../state/planner'

export function Modal({ open, onClose, title, children, className = '' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return <dialog ref={ref} className={`modal ${className}`} aria-labelledby={titleId} onClose={onClose} onCancel={(event) => { event.preventDefault(); onClose() }}>
    <div className="modal-header"><h2 id={titleId}>{title}</h2><button className="icon-button" type="button" onClick={onClose} aria-label={`Close ${title}`}><X /></button></div>
    {children}
  </dialog>
}

export function PreferencesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = usePlanner()
  const [value, setValue] = useState(String(state.weeklyStudyLimitHours))
  useEffect(() => setValue(String(state.weeklyStudyLimitHours)), [state.weeklyStudyLimitHours, open])
  const numeric = Number(value)
  const valid = value !== '' && Number.isFinite(numeric) && numeric >= 1 && numeric <= 80
  return <Modal open={open} onClose={onClose} title="Workload preference">
    <form onSubmit={(event) => { event.preventDefault(); if (valid) { dispatch({ type: 'SET_LIMIT', hours: numeric }); onClose() } }}>
      <p className="muted">Set the weekly study-time limit used to flag demanding weeks. This is a personal planning aid, not a university standard.</p>
      <label className="field-label" htmlFor="study-limit">Weekly study-time limit</label>
      <div className="input-with-unit"><input id="study-limit" type="number" min="1" max="80" step="0.5" value={value} onChange={(event) => setValue(event.target.value)} aria-describedby="limit-help limit-error" /><span>hours/week</span></div>
      <p id="limit-help" className="field-help">Choose a value from 1 to 80 hours.</p>
      {!valid && <p id="limit-error" className="field-error">Enter a valid limit from 1 to 80.</p>}
      <div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit" disabled={!valid}>Save limit</button></div>
    </form>
  </Modal>
}

export function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <Modal open={open} onClose={onClose} title="About the estimates">
    <div className="prose compact">
      <p>All workloads, dates, meeting patterns, and course details are illustrative. This prototype is not connected to USC registration and does not verify degree requirements.</p>
      <ul>
        <li>Weekly totals add recurring study and extra assessment preparation.</li>
        <li>Displayed hours exclude scheduled class meetings.</li>
        <li>Course units are shown separately and do not determine workload estimates.</li>
        <li>No real student reports, historical syllabi, forecast model, or accuracy measure is connected.</li>
        <li>Course substitutions, prerequisites, and requirement satisfaction are not checked.</li>
      </ul>
    </div>
    <div className="modal-actions"><button className="button primary" type="button" onClick={onClose}>Got it</button></div>
  </Modal>
}
