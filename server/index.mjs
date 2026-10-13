import 'dotenv/config'
import express from 'express'
import multer from 'multer'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MAX_FILE_BYTES, normalizedFileType, parseSyllabusWithOpenAI, SyllabusParseError } from './syllabus.mjs'

const serverDirectory = dirname(fileURLToPath(import.meta.url))
const appRoot = join(serverDirectory, '..')
const args = process.argv.slice(2)
const isDevelopment = args.includes('--dev')

function argumentValue(name, fallback) {
  const index = args.indexOf(name)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}

const host = argumentValue('--host', process.env.HOST ?? '127.0.0.1')
const port = Number(argumentValue('--port', process.env.PORT ?? (isDevelopment ? '5173' : '4173')))
if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error('Invalid server port')

const app = express()
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 1, fileSize: MAX_FILE_BYTES } })

function requireSameOrigin(request, response, next) {
  const origin = request.get('origin')
  if (!origin) return next()
  try {
    if (new URL(origin).host !== request.get('host')) {
      return response.status(403).json({ error: { code: 'cross_origin_request', message: 'Cross-origin syllabus uploads are not allowed.' } })
    }
  } catch {
    return response.status(403).json({ error: { code: 'invalid_origin', message: 'The syllabus upload origin is invalid.' } })
  }
  return next()
}

app.disable('x-powered-by')
app.post('/api/syllabi/parse', requireSameOrigin, upload.single('syllabus'), async (request, response, next) => {
  try {
    response.setHeader('Cache-Control', 'no-store')
    if (!request.file) throw new SyllabusParseError('Choose a syllabus file to upload.', 400, 'missing_file')
    const fileType = normalizedFileType(request.file.originalname)
    if (!fileType.mimeType) {
      throw new SyllabusParseError('Choose a PDF, Word, RTF, OpenDocument, TXT, or Markdown syllabus.', 415, 'unsupported_file')
    }
    const expectedCourse = {
      code: typeof request.body.courseCode === 'string' ? request.body.courseCode.slice(0, 80) : '',
      title: typeof request.body.courseTitle === 'string' ? request.body.courseTitle.slice(0, 200) : '',
      term: typeof request.body.term === 'string' ? request.body.term.slice(0, 80) : '',
    }
    const parsed = await parseSyllabusWithOpenAI({
      buffer: request.file.buffer,
      fileName: request.file.originalname,
      mimeType: fileType.mimeType,
      expectedCourse,
    })
    response.json({
      syllabus: parsed.syllabus,
      meta: {
        fileName: request.file.originalname,
        sizeBytes: request.file.size,
        parsedAt: new Date().toISOString(),
        model: parsed.model,
      },
    })
  } catch (error) {
    next(error)
  }
})

app.use((error, _request, response, next) => {
  if (response.headersSent) return next(error)
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return response.status(413).json({ error: { code: 'file_too_large', message: 'The syllabus must be 20 MB or smaller.' } })
  }
  if (error instanceof SyllabusParseError) {
    return response.status(error.status).json({ error: { code: error.code, message: error.message } })
  }
  console.error('Syllabus endpoint failed', error)
  return response.status(500).json({ error: { code: 'internal_error', message: 'The syllabus could not be parsed.' } })
})

if (isDevelopment) {
  const { createServer: createViteServer } = await import('vite')
  const vite = await createViteServer({
    root: appRoot,
    server: { middlewareMode: true },
    appType: 'spa',
  })
  app.use(vite.middlewares)
} else {
  const distDirectory = join(appRoot, 'dist')
  app.use(express.static(distDirectory))
  app.use((request, response, next) => {
    if (request.method === 'GET' && request.accepts('html')) return response.sendFile(join(distDirectory, 'index.html'))
    return next()
  })
}

const server = app.listen(port, host, () => {
  console.log(`LoadLens ${isDevelopment ? 'development' : 'production'} server running at http://${host}:${port}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}
