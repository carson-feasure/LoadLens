import { MAX_SYLLABUS_FILE_BYTES, validateParsedSyllabus, validateSyllabusFile } from '../domain/syllabus'

const parsedSyllabus = {
  course: {
    code: 'COG 107',
    title: 'Data Science for Cognitive Science',
    term: 'Fall 2026',
    section: '12345',
    instructor: 'Dr. Rivera',
    units: 4,
    meetingPattern: 'Mon/Wed 10:00–11:20',
    summary: 'Data analysis foundations for cognitive science.',
  },
  selectedCourseMatch: { matches: true, explanation: 'The course code and title match.' },
  weeks: [{
    weekNumber: 1,
    label: 'Introduction',
    startDate: '2026-08-31',
    endDate: '2026-09-06',
    topics: ['Data and evidence'],
    readings: ['Chapter 1'],
    assignments: [{ title: 'Reflection', kind: 'homework', dueDate: '2026-09-04', weight: '5%', details: 'One page.' }],
    workloadNotes: ['Complete the setup exercise.'],
  }],
  grading: [{ component: 'Homework', weight: '30%', details: 'Weekly assignments.' }],
  policies: ['Late work loses 10% per day.'],
  warnings: [],
}

describe('syllabus parsing boundary', () => {
  test('accepts the structured syllabus contract', () => {
    expect(validateParsedSyllabus(parsedSyllabus)).toEqual(parsedSyllabus)
  })

  test('rejects invalid week numbers and malformed nested arrays', () => {
    expect(() => validateParsedSyllabus({ ...parsedSyllabus, weeks: [{ ...parsedSyllabus.weeks[0], weekNumber: 0 }] })).toThrow(/week number/i)
    expect(() => validateParsedSyllabus({ ...parsedSyllabus, policies: 'none' })).toThrow(/policies/i)
  })

  test('validates supported file types, empty files, and the 20 MB limit', () => {
    expect(validateSyllabusFile(new File(['week one'], 'syllabus.pdf', { type: 'application/pdf' }))).toBeNull()
    expect(validateSyllabusFile(new File(['week one'], 'syllabus.exe'))).toMatch(/PDF, Word/i)
    expect(validateSyllabusFile(new File([], 'syllabus.txt'))).toMatch(/empty/i)
    const tooLarge = new File([new Uint8Array(MAX_SYLLABUS_FILE_BYTES + 1)], 'syllabus.txt')
    expect(validateSyllabusFile(tooLarge)).toMatch(/20 MB/i)
  })
})
