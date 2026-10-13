// @vitest-environment node
import { describe, expect, test, vi } from 'vitest'
import { extractResponseText, normalizedFileType, parseSyllabusWithOpenAI } from './syllabus.mjs'

const syllabus = {
  course: { code: 'COG 107', title: 'Data Science for Cognitive Science', term: 'Fall 2026', section: '', instructor: '', units: 4, meetingPattern: '', summary: '' },
  selectedCourseMatch: { matches: true, explanation: 'Course code matches.' },
  weeks: [],
  grading: [],
  policies: [],
  warnings: [],
}

describe('syllabus server helpers', () => {
  test('normalizes only supported document extensions', () => {
    expect(normalizedFileType('course.PDF').mimeType).toBe('application/pdf')
    expect(normalizedFileType('course.docx').mimeType).toContain('wordprocessingml')
    expect(normalizedFileType('course.exe').mimeType).toBeNull()
  })

  test('extracts output text from a Responses API message', () => {
    expect(extractResponseText({ output: [{ type: 'message', content: [{ type: 'output_text', text: '{"ok":true}' }] }] })).toBe('{"ok":true}')
  })

  test('sends the file through Responses API with strict structured output', async () => {
    const fetchImpl = vi.fn(async (_url, init) => {
      const request = JSON.parse(init.body)
      expect(request.model).toBe('gpt-6-luna')
      expect(request.store).toBe(false)
      expect(request.text.format.type).toBe('json_schema')
      expect(request.text.format.strict).toBe(true)
      expect(request.input[0].content[1].file_data).toMatch(/^data:text\/plain;base64,/)
      return new Response(JSON.stringify({ output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(syllabus) }] }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    const result = await parseSyllabusWithOpenAI({
      buffer: Buffer.from('Week 1: introduction'),
      fileName: 'course.txt',
      mimeType: 'text/plain',
      expectedCourse: { code: 'COG 107', title: 'Data Science for Cognitive Science', term: 'Fall 2026' },
    }, { apiKey: 'test-key', model: 'gpt-6-luna', fetchImpl })
    expect(result.syllabus).toEqual(syllabus)
    expect(fetchImpl).toHaveBeenCalledOnce()
  })
})
