const baseUrl = process.argv[2] ?? 'http://127.0.0.1:4173'
const [siteResponse, apiResponse] = await Promise.all([
  fetch(baseUrl),
  fetch(`${baseUrl}/api/syllabi/parse`, { method: 'POST' }),
])
if (siteResponse.status !== 200 || apiResponse.status !== 400) {
  throw new Error(`Unexpected production server statuses: site ${siteResponse.status}, API ${apiResponse.status}`)
}
const apiBody = await apiResponse.json()
if (apiBody?.error?.code !== 'missing_file') throw new Error('The production API did not return its expected upload validation error')
console.log(`Production server smoke passed: site ${siteResponse.status}, API validation ${apiResponse.status}`)
