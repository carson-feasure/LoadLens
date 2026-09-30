import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(scriptDirectory, '..')
const deliverablesRoot = join(appRoot, 'deliverables')
const packageRoot = join(deliverablesRoot, 'LoadLens-Email-Package')
const sourceRoot = join(packageRoot, 'source')

if (!packageRoot.startsWith(`${deliverablesRoot}\\`) && !packageRoot.startsWith(`${deliverablesRoot}/`)) {
  throw new Error('Refusing to package outside the app deliverables directory')
}

await rm(packageRoot, { recursive: true, force: true })
await mkdir(sourceRoot, { recursive: true })

const builtIndex = await readFile(join(appRoot, 'dist', 'index.html'), 'utf8')
const scriptMatch = builtIndex.match(/<script type="module" crossorigin src="([^"]+\.js)"><\/script>/)
const styleMatch = builtIndex.match(/<link rel="stylesheet" crossorigin href="([^"]+\.css)">/)

if (!scriptMatch?.[1] || !styleMatch?.[1]) {
  throw new Error('Could not identify the built JavaScript and CSS assets in dist/index.html')
}

const assetPath = (browserPath) => join(appRoot, 'dist', ...browserPath.replace(/^\//, '').split('/'))
const javascript = await readFile(assetPath(scriptMatch[1]), 'utf8')
const css = (await readFile(assetPath(styleMatch[1]), 'utf8')).replace(/<\/style/gi, '<\\/style')
const javascriptBase64 = Buffer.from(javascript, 'utf8').toString('base64')
const offlineModuleLoader = `<script>
(() => {
  const binary = atob('${javascriptBase64}')
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  const source = new TextDecoder().decode(bytes)
  const moduleUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }))

  import(moduleUrl)
    .catch((error) => {
      console.error('LoadLens failed to start', error)
      document.body.innerHTML = '<main style="font-family:system-ui;padding:2rem"><h1>LoadLens could not start</h1><p>Try opening this file in a current version of Chrome, Edge, or Firefox.</p></main>'
    })
    .finally(() => URL.revokeObjectURL(moduleUrl))
})()
</script>`

const standaloneHtml = builtIndex
  .replace(scriptMatch[0], offlineModuleLoader)
  .replace(styleMatch[0], `<style>\n${css}\n</style>`)
  .replace('<head>', '<head>\n    <!-- Self-contained offline LoadLens build. No external assets or network calls are required. -->')

await writeFile(join(packageRoot, 'Open LoadLens.html'), standaloneHtml, 'utf8')

const ignoredTopLevel = new Set([
  'node_modules',
  'dist',
  'deliverables',
  'playwright-report',
  'test-results',
])

const topLevelEntries = await readdir(appRoot, { withFileTypes: true })
for (const entry of topLevelEntries) {
  if (ignoredTopLevel.has(entry.name)) continue
  await cp(join(appRoot, entry.name), join(sourceRoot, entry.name), {
    recursive: entry.isDirectory(),
  })
}

const readme = `LoadLens email package
======================

OPEN THE SITE
-------------
Double-click "Open LoadLens.html". It is a self-contained offline website and
does not require Node, npm, a web server, an account, or an internet connection.

Chrome, Edge, and Firefox are recommended. If a browser restricts local browser
storage for file:// pages, LoadLens still runs in memory and displays a notice;
changes then last only until the tab closes.

WHAT IS INCLUDED
----------------
- Open LoadLens.html: the complete runnable site in one file.
- source/: the full React/TypeScript source, tests, docs, and package lock.

SOURCE DEVELOPMENT
------------------
From source/ with Node 20 installed:

  npm install
  npm run dev

The application uses illustrative demo data only. It is not connected to USC
registration and does not verify course requirements or forecast accuracy.
`

await writeFile(join(packageRoot, 'README.txt'), readme, 'utf8')

console.log(`Created email package folder: ${packageRoot}`)
console.log(`Standalone site: ${join(packageRoot, 'Open LoadLens.html')}`)
