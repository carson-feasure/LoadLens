export const MAX_SYLLABUS_FILE_BYTES = 20 * 1024 * 1024
export const SYLLABUS_ACCEPT = '.pdf,.doc,.docx,.rtf,.odt,.txt,.md'

export interface ParsedSyllabusAssignment {
  title: string
  kind: string
  dueDate: string
  weight: string
  details: string
}

export interface ParsedSyllabusWeek {
  weekNumber: number | null
  label: string
  startDate: string
  endDate: string
  topics: string[]
  readings: string[]
  assignments: ParsedSyllabusAssignment[]
  workloadNotes: string[]
}

export interface ParsedSyllabus {
  course: {
    code: string
    title: string
    term: string
    section: string
    instructor: string
    units: number | null
    meetingPattern: string
    summary: string
  }
  selectedCourseMatch: {
    matches: boolean
    explanation: string
  }
  weeks: ParsedSyllabusWeek[]
  grading: Array<{ component: string; weight: string; details: string }>
  policies: string[]
  warnings: string[]
}

export interface SavedSyllabus {
  fileName: string
  parsedAt: string
  model: string
  sizeBytes: number
  data: ParsedSyllabus
}

export interface SyllabusApiResponse {
  syllabus: ParsedSyllabus
  meta: Omit<SavedSyllabus, 'data'>
}

const text = (value: unknown, label: string) => {
  if (typeof value !== 'string') throw new Error(`Invalid syllabus ${label}`)
  return value
}

const textArray = (value: unknown, label: string) => {
  if (!Array.isArray(value)) throw new Error(`Invalid syllabus ${label}`)
  return value.map((item, index) => text(item, `${label}[${index}]`))
}

const record = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid syllabus ${label}`)
  return value as Record<string, unknown>
}

export function validateParsedSyllabus(value: unknown): ParsedSyllabus {
  const root = record(value, 'response')
  const rawCourse = record(root.course, 'course')
  const rawMatch = record(root.selectedCourseMatch, 'selected course match')
  if (typeof rawMatch.matches !== 'boolean') throw new Error('Invalid syllabus course match')

  let units: number | null = null
  if (rawCourse.units !== null) {
    if (!Number.isFinite(rawCourse.units) || Number(rawCourse.units) <= 0 || Number(rawCourse.units) > 40) {
      throw new Error('Invalid syllabus units')
    }
    units = Number(rawCourse.units)
  }

  if (!Array.isArray(root.weeks) || root.weeks.length > 52) throw new Error('Invalid syllabus weeks')
  const weeks = root.weeks.map((item, weekIndex) => {
    const rawWeek = record(item, `week ${weekIndex + 1}`)
    let weekNumber: number | null = null
    if (rawWeek.weekNumber !== null) {
      if (!Number.isInteger(rawWeek.weekNumber) || Number(rawWeek.weekNumber) < 1 || Number(rawWeek.weekNumber) > 52) {
        throw new Error(`Invalid syllabus week number at ${weekIndex + 1}`)
      }
      weekNumber = Number(rawWeek.weekNumber)
    }
    if (!Array.isArray(rawWeek.assignments) || rawWeek.assignments.length > 100) throw new Error(`Invalid syllabus assignments at week ${weekIndex + 1}`)
    return {
      weekNumber,
      label: text(rawWeek.label, `week ${weekIndex + 1} label`),
      startDate: text(rawWeek.startDate, `week ${weekIndex + 1} start date`),
      endDate: text(rawWeek.endDate, `week ${weekIndex + 1} end date`),
      topics: textArray(rawWeek.topics, `week ${weekIndex + 1} topics`),
      readings: textArray(rawWeek.readings, `week ${weekIndex + 1} readings`),
      assignments: rawWeek.assignments.map((assignment, assignmentIndex) => {
        const rawAssignment = record(assignment, `week ${weekIndex + 1} assignment ${assignmentIndex + 1}`)
        return {
          title: text(rawAssignment.title, 'assignment title'),
          kind: text(rawAssignment.kind, 'assignment kind'),
          dueDate: text(rawAssignment.dueDate, 'assignment due date'),
          weight: text(rawAssignment.weight, 'assignment weight'),
          details: text(rawAssignment.details, 'assignment details'),
        }
      }),
      workloadNotes: textArray(rawWeek.workloadNotes, `week ${weekIndex + 1} workload notes`),
    }
  })

  if (!Array.isArray(root.grading) || root.grading.length > 100) throw new Error('Invalid syllabus grading')
  const grading = root.grading.map((item, index) => {
    const rawItem = record(item, `grading item ${index + 1}`)
    return {
      component: text(rawItem.component, 'grading component'),
      weight: text(rawItem.weight, 'grading weight'),
      details: text(rawItem.details, 'grading details'),
    }
  })

  return {
    course: {
      code: text(rawCourse.code, 'course code'),
      title: text(rawCourse.title, 'course title'),
      term: text(rawCourse.term, 'course term'),
      section: text(rawCourse.section, 'course section'),
      instructor: text(rawCourse.instructor, 'course instructor'),
      units,
      meetingPattern: text(rawCourse.meetingPattern, 'meeting pattern'),
      summary: text(rawCourse.summary, 'course summary'),
    },
    selectedCourseMatch: {
      matches: rawMatch.matches,
      explanation: text(rawMatch.explanation, 'course match explanation'),
    },
    weeks,
    grading,
    policies: textArray(root.policies, 'policies'),
    warnings: textArray(root.warnings, 'warnings'),
  }
}

export function validateSyllabusApiResponse(value: unknown): SyllabusApiResponse {
  const root = record(value, 'API response')
  const rawMeta = record(root.meta, 'API metadata')
  const parsedAt = text(rawMeta.parsedAt, 'parsed timestamp')
  if (Number.isNaN(Date.parse(parsedAt))) throw new Error('Invalid syllabus parsed timestamp')
  if (!Number.isFinite(rawMeta.sizeBytes) || Number(rawMeta.sizeBytes) < 1) throw new Error('Invalid syllabus file size')
  return {
    syllabus: validateParsedSyllabus(root.syllabus),
    meta: {
      fileName: text(rawMeta.fileName, 'file name'),
      parsedAt,
      model: text(rawMeta.model, 'model'),
      sizeBytes: Number(rawMeta.sizeBytes),
    },
  }
}

export function validateSyllabusFile(file: File): string | null {
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? ''
  if (!SYLLABUS_ACCEPT.split(',').includes(extension)) return 'Choose a PDF, Word, RTF, OpenDocument, TXT, or Markdown file.'
  if (file.size === 0) return 'That file is empty.'
  if (file.size > MAX_SYLLABUS_FILE_BYTES) return 'The syllabus must be 20 MB or smaller.'
  return null
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
