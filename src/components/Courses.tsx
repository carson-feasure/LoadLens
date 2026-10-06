import { useMemo, useState } from 'react'
import { Check, Plus, Search, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { averageCourseHours, formatHours, matchesCourse, workloadLevel } from '../domain/calculations'
import { courseMap, demoData } from '../domain/data'
import type { Course } from '../domain/types'
import { Modal } from './Dialogs'

export function CourseDot({ color }: { color: string }) { return <span className="course-dot" style={{ backgroundColor: color }} aria-hidden="true" /> }

export function CourseList({ courseIds, origin, onRemove, changed }: { courseIds: string[]; origin: 'build' | 'adjust' | 'current'; onRemove?: (id: string) => void; changed?: { added?: string[]; removed?: string[] } }) {
  if (!courseIds.length) return <div className="empty-inline"><strong>No courses in this plan</strong><span>Use the course picker to create a comparison.</span></div>
  return <ul className="course-list">{courseIds.map((id) => {
    const course = courseMap.get(id)
    if (!course) return null
    const status = changed?.added?.includes(id) ? 'Added' : changed?.removed?.includes(id) ? 'Removed' : null
    return <li key={id}>
      <CourseDot color={course.color} />
      <div className="course-row-main"><Link to={`/courses/${id}?origin=${origin}`}>{course.code}</Link><span>{course.title}</span>{status && <small className={status.toLowerCase()}>{status}</small>}</div>
      <span className="course-units">{course.units} units</span>
      {onRemove && <button type="button" className="remove-course" onClick={() => onRemove(id)} aria-label={`Remove ${course.code}`}><Trash2 /></button>}
    </li>
  })}</ul>
}

type Filter = 'all' | Course['catalogGroup']
type Level = 'all' | ReturnType<typeof workloadLevel>
type Sort = 'code' | 'workload'
type Program = 'all' | string

export const programOptions = [...new Set(demoData.courses.flatMap((course) => course.programTags))].sort((a, b) => a.localeCompare(b))

export function useCatalog(query: string, group: Filter, level: Level, program: Program, sort: Sort) {
  return useMemo(() => demoData.courses.filter((course) => matchesCourse(course, query))
    .filter((course) => group === 'all' || course.catalogGroup === group)
    .filter((course) => level === 'all' || workloadLevel(course) === level)
    .filter((course) => program === 'all' || course.programTags.includes(program))
    .sort((a, b) => sort === 'code' ? a.code.localeCompare(b.code) : averageCourseHours(a) - averageCourseHours(b)), [query, group, level, program, sort])
}

export function CourseFilters({ query, setQuery, group, setGroup, level, setLevel, program, setProgram, sort, setSort, onClear }: { query: string; setQuery: (value: string) => void; group: Filter; setGroup: (value: Filter) => void; level: Level; setLevel: (value: Level) => void; program: Program; setProgram: (value: Program) => void; sort: Sort; setSort: (value: Sort) => void; onClear?: () => void }) {
  const active = query || group !== 'all' || level !== 'all' || program !== 'all' || sort !== 'code'
  return <div className="catalog-controls">
    <label className="search-field"><Search /><span className="sr-only">Search courses</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by course name or number" /></label>
    <div className="filter-row">
      <label>Group<select value={group} onChange={(event) => setGroup(event.target.value as Filter)}><option value="all">All groups</option><option value="ge-example">GE examples</option><option value="writing">Writing</option><option value="major">Major examples</option></select></label>
      <label>Workload<select value={level} onChange={(event) => setLevel(event.target.value as Level)}><option value="all">All levels</option><option value="light">Light ≤3 hrs</option><option value="moderate">Moderate 3–5 hrs</option><option value="heavy">Heavy &gt;5 hrs</option></select></label>
      <label>Major / interest (demo)<select value={program} onChange={(event) => setProgram(event.target.value)}><option value="all">All demo interests</option>{programOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
      <label>Sort<select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="code">Course code</option><option value="workload">Lowest workload</option></select></label>
      {active && <button type="button" className="text-button" onClick={() => { if (onClear) onClear(); else { setQuery(''); setGroup('all'); setLevel('all'); setProgram('all'); setSort('code') } }}><X /> Clear</button>}
    </div>
  </div>
}

export function CatalogGrid({ courses, selectedIds, onAdd }: { courses: Course[]; selectedIds: string[]; onAdd: (id: string) => void }) {
  if (!courses.length) return <div className="empty-state compact"><strong>No courses match</strong><span>Try clearing a filter or searching a different course code.</span></div>
  return <div className="catalog-grid">{courses.map((course) => {
    const selected = selectedIds.includes(course.id)
    const level = workloadLevel(course)
    return <article className="catalog-card" key={course.id}>
      <div><CourseDot color={course.color} /><span className="level-badge">{level} workload</span></div>
      <Link to={`/courses/${course.id}?origin=build`}><strong>{course.code}</strong><span>{course.title}</span></Link>
      <p className="catalog-description">{course.description}</p>
      <dl className="catalog-card-meta">
        <div><dt>Meeting</dt><dd>{course.meetingPattern}</dd></div>
        <div><dt>Group</dt><dd>{course.catalogGroup.replace('-', ' ')}</dd></div>
        <div><dt>Workload</dt><dd>{formatHours(averageCourseHours(course))} avg hrs/week</dd></div>
        <div><dt>Units</dt><dd>{course.units}</dd></div>
      </dl>
      <p className="program-tags"><span>Demo interests</span>{course.programTags.join(' · ')}</p>
      <button type="button" disabled={selected} onClick={() => onAdd(course.id)}>{selected ? <><Check /> Added</> : <><Plus /> Add</>}</button>
    </article>
  })}</div>
}

export function CoursePicker({ open, onClose, selectedIds, onAdd, title = 'Add a course' }: { open: boolean; onClose: () => void; selectedIds: string[]; onAdd: (id: string) => void; title?: string }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<Filter>('all')
  const [level, setLevel] = useState<Level>('all')
  const [program, setProgram] = useState<Program>('all')
  const [sort, setSort] = useState<Sort>('code')
  const courses = useCatalog(query, group, level, program, sort)
  return <Modal open={open} onClose={onClose} title={title} className="picker-modal">
    <CourseFilters {...{ query, setQuery, group, setGroup, level, setLevel, program, setProgram, sort, setSort }} />
    <CatalogGrid courses={courses} selectedIds={selectedIds} onAdd={onAdd} />
    <p className="modal-footnote">Demo workload categories: Light ≤3, Moderate &gt;3 to ≤5, Heavy &gt;5 average hrs/week. Major / interest labels are illustrative filters, not verified degree requirements.</p>
  </Modal>
}
