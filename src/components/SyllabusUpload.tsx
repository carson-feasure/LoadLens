import { useId, useRef, useState, type ChangeEvent } from 'react'
import { AlertTriangle, CheckCircle2, FileJson, FileText, LoaderCircle, RotateCw, Trash2, Upload } from 'lucide-react'
import type { Course } from '../domain/types'
import {
  formatFileSize,
  SYLLABUS_ACCEPT,
  validateSyllabusApiResponse,
  validateSyllabusFile,
} from '../domain/syllabus'
import { usePlanner } from '../state/planner'

function apiErrorMessage(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const error = (value as { error?: unknown }).error
  if (!error || typeof error !== 'object') return null
  const message = (error as { message?: unknown }).message
  return typeof message === 'string' ? message : null
}

function dateRange(startDate: string, endDate: string) {
  if (startDate && endDate) return `${startDate} – ${endDate}`
  return startDate || endDate
}

export function SyllabusUpload({ course }: { course: Course }) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const { state, dispatch } = usePlanner()
  const saved = state.uploadedSyllabi[course.id]
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const chooseFile = () => {
    setError(null)
    setSuccess(null)
    inputRef.current?.click()
  }

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const validationError = validateSyllabusFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsParsing(true)
    setError(null)
    setSuccess(null)
    try {
      const form = new FormData()
      form.append('syllabus', file)
      form.append('courseCode', course.code)
      form.append('courseTitle', course.title)
      form.append('term', 'Fall 2026')
      const response = await fetch('/api/syllabi/parse', { method: 'POST', body: form })
      let body: unknown = null
      try { body = await response.json() } catch { /* handled below */ }
      if (!response.ok) {
        const fallback = response.status === 404
          ? 'Syllabus parsing is not available on this static host. Run LoadLens with its Node server.'
          : 'The syllabus could not be parsed.'
        throw new Error(apiErrorMessage(body) ?? fallback)
      }
      const parsed = validateSyllabusApiResponse(body)
      dispatch({
        type: 'SYLLABUS_SAVE',
        courseId: course.id,
        syllabus: { ...parsed.meta, data: parsed.syllabus },
      })
      setSuccess(`${file.name} was parsed into ${parsed.syllabus.weeks.length} week${parsed.syllabus.weeks.length === 1 ? '' : 's'}.`)
    } catch (uploadError) {
      if (uploadError instanceof TypeError) {
        setError('Could not reach the syllabus service. Run the server with npm run dev and try again.')
      } else {
        setError(uploadError instanceof Error ? uploadError.message : 'The syllabus could not be parsed.')
      }
    } finally {
      setIsParsing(false)
    }
  }

  const removeSaved = () => {
    if (!saved || !window.confirm(`Remove the parsed data from ${saved.fileName}? You can upload it again later.`)) return
    dispatch({ type: 'SYLLABUS_REMOVE', courseId: course.id })
    setSuccess('The parsed syllabus was removed from this browser.')
    setError(null)
  }

  return <div className="syllabus-import">
    <input
      ref={inputRef}
      id={inputId}
      className="sr-only"
      type="file"
      accept={SYLLABUS_ACCEPT}
      onChange={uploadFile}
      disabled={isParsing}
    />

    {!saved && <section className="syllabus-upload-card" aria-labelledby={`${inputId}-title`}>
      <span className="syllabus-upload-icon"><FileText aria-hidden="true" /></span>
      <div>
        <p className="eyebrow">ADD YOUR DOCUMENT</p>
        <h3 id={`${inputId}-title`}>Turn a syllabus into a weekly plan</h3>
        <p>Upload a PDF, Word, RTF, OpenDocument, TXT, or Markdown file. LoadLens sends it securely through the server and saves only the parsed JSON in this browser.</p>
        <small>20 MB maximum. The file itself is not saved by LoadLens.</small>
      </div>
      <button className="button primary" type="button" onClick={chooseFile} disabled={isParsing}>
        {isParsing ? <><LoaderCircle className="spin" aria-hidden="true" /> Parsing syllabus…</> : <><Upload aria-hidden="true" /> Upload Syllabus</>}
      </button>
    </section>}

    {isParsing && <div className="syllabus-progress" role="status">
      <LoaderCircle className="spin" aria-hidden="true" />
      <div><strong>Reading the course and weekly schedule</strong><span>This can take up to a minute for a long or scanned PDF.</span></div>
    </div>}
    {error && <div className="syllabus-message error" role="alert"><AlertTriangle aria-hidden="true" /><span>{error}</span></div>}
    {success && <div className="syllabus-message success" role="status"><CheckCircle2 aria-hidden="true" /><span>{success}</span></div>}

    {saved && <section className="parsed-syllabus" aria-labelledby={`${inputId}-parsed-title`}>
      <div className="parsed-syllabus-header">
        <div>
          <p className="eyebrow">PARSED SYLLABUS</p>
          <h3 id={`${inputId}-parsed-title`}>{saved.data.course.code || course.code} · {saved.data.course.title || course.title}</h3>
          <p>{saved.data.course.summary || 'The document did not include a course summary.'}</p>
          <small><FileJson aria-hidden="true" /> {saved.fileName} · {formatFileSize(saved.sizeBytes)} · Parsed {new Date(saved.parsedAt).toLocaleString()}</small>
        </div>
        <div className="parsed-syllabus-actions">
          <button className="button secondary" type="button" onClick={chooseFile} disabled={isParsing}><RotateCw aria-hidden="true" /> Replace</button>
          <button className="icon-button danger" type="button" onClick={removeSaved} disabled={isParsing} aria-label={`Remove parsed syllabus for ${course.code}`}><Trash2 aria-hidden="true" /></button>
        </div>
      </div>

      <div className={saved.data.selectedCourseMatch.matches ? 'course-match success' : 'course-match warning'}>
        {saved.data.selectedCourseMatch.matches ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
        <div><strong>{saved.data.selectedCourseMatch.matches ? `Matches ${course.code}` : `Check this file against ${course.code}`}</strong><span>{saved.data.selectedCourseMatch.explanation}</span></div>
      </div>

      <dl className="parsed-course-meta">
        <div><dt>Term</dt><dd>{saved.data.course.term || 'Not listed'}</dd></div>
        <div><dt>Section</dt><dd>{saved.data.course.section || 'Not listed'}</dd></div>
        <div><dt>Instructor</dt><dd>{saved.data.course.instructor || 'Not listed'}</dd></div>
        <div><dt>Units</dt><dd>{saved.data.course.units ?? 'Not listed'}</dd></div>
        <div><dt>Meeting pattern</dt><dd>{saved.data.course.meetingPattern || 'Not listed'}</dd></div>
        <div><dt>Weeks found</dt><dd>{saved.data.weeks.length}</dd></div>
      </dl>

      {saved.data.warnings.length > 0 && <div className="parse-warnings"><strong>Extraction notes</strong><ul>{saved.data.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul></div>}

      <div className="parsed-week-list">
        <div className="section-title-row"><div><p className="eyebrow">WEEK-BY-WEEK OUTPUT</p><h3>Course schedule</h3></div><span>{saved.data.weeks.length} weeks</span></div>
        {saved.data.weeks.length ? saved.data.weeks.map((week, weekIndex) => <article key={`${week.weekNumber ?? 'module'}-${weekIndex}`} className="parsed-week">
          <div className="parsed-week-label">
            <strong>{week.weekNumber ? `Week ${week.weekNumber}` : week.label || `Module ${weekIndex + 1}`}</strong>
            {(week.label && week.label !== `Week ${week.weekNumber}`) && <span>{week.label}</span>}
            {dateRange(week.startDate, week.endDate) && <small>{dateRange(week.startDate, week.endDate)}</small>}
          </div>
          <div className="parsed-week-content">
            {week.topics.length > 0 && <div><h4>Topics</h4><ul>{week.topics.map((topic, index) => <li key={`${topic}-${index}`}>{topic}</li>)}</ul></div>}
            {week.readings.length > 0 && <div><h4>Readings</h4><ul>{week.readings.map((reading, index) => <li key={`${reading}-${index}`}>{reading}</li>)}</ul></div>}
            {week.assignments.length > 0 && <div><h4>Assignments & deadlines</h4><ul className="parsed-assignments">{week.assignments.map((assignment, index) => <li key={`${assignment.title}-${index}`}><strong>{assignment.title || assignment.kind || 'Assignment'}</strong><span>{[assignment.kind, assignment.dueDate && `Due ${assignment.dueDate}`, assignment.weight].filter(Boolean).join(' · ')}</span>{assignment.details && <small>{assignment.details}</small>}</li>)}</ul></div>}
            {week.workloadNotes.length > 0 && <div><h4>Workload notes</h4><ul>{week.workloadNotes.map((note, index) => <li key={`${note}-${index}`}>{note}</li>)}</ul></div>}
            {!week.topics.length && !week.readings.length && !week.assignments.length && !week.workloadNotes.length && <p className="empty-week">No scheduled content was listed for this week.</p>}
          </div>
        </article>) : <div className="empty-inline"><span>No week-by-week schedule was found in this document.</span></div>}
      </div>

      {(saved.data.grading.length > 0 || saved.data.policies.length > 0) && <div className="parsed-extras">
        {saved.data.grading.length > 0 && <section><h3>Grading</h3><ul>{saved.data.grading.map((item, index) => <li key={`${item.component}-${index}`}><strong>{item.component}</strong><span>{[item.weight, item.details].filter(Boolean).join(' · ')}</span></li>)}</ul></section>}
        {saved.data.policies.length > 0 && <section><h3>Policies</h3><ul>{saved.data.policies.map((policy, index) => <li key={`${policy}-${index}`}>{policy}</li>)}</ul></section>}
      </div>}

      <details className="syllabus-json"><summary>View parsed JSON</summary><pre>{JSON.stringify(saved.data, null, 2)}</pre></details>
      <p className="parsed-model-note">Parsed with {saved.model}. Review extracted dates and requirements against the original syllabus before relying on them.</p>
    </section>}
  </div>
}
