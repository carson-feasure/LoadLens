import { demoData } from './data'

const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year!, month! - 1, day!)
}

export function formatDate(value: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  return new Intl.DateTimeFormat('en-US', options).format(parseDateOnly(value))
}

export function weekLabel(week: number) {
  const item = demoData.term.weeks[week - 1]
  return item ? `${formatDate(item.startDate)}–${formatDate(item.endDate)}` : ''
}

export function datesForWeek(week: number) {
  const item = demoData.term.weeks[week - 1]
  if (!item) return []
  const start = parseDateOnly(item.startDate)
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(start)
    date.setDate(start.getDate() + offset)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
}
