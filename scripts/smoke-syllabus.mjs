import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5173'
const filePath = join(process.cwd(), 'e2e', 'fixtures', 'sample-syllabus.txt')
const bytes = await readFile(filePath)
const form = new FormData()
form.append('syllabus', new Blob([bytes], { type: 'text/plain' }), 'sample-syllabus.txt')
form.append('courseCode', 'COG 107')
form.append('courseTitle', 'Data Science for Cognitive Science')
form.append('term', 'Fall 2026')

const response = await fetch(`${baseUrl}/api/syllabi/parse`, { method: 'POST', body: form })
const body = await response.json()
if (!response.ok) throw new Error(`Live syllabus parse failed (${response.status}): ${body?.error?.message ?? 'unknown error'}`)
if (body?.syllabus?.course?.code !== 'COG 107' || body?.syllabus?.weeks?.length !== 3) {
  throw new Error('Live syllabus parse returned an unexpected course or week count')
}
console.log(`Live syllabus parse passed: ${body.syllabus.course.code}, ${body.syllabus.weeks.length} weeks, model ${body.meta.model}`)
