const weekdays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** Matches the reference heading style: `Monday, 19 October 2026`. */
export function formatDateHeading(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${weekdays[date.getDay()]}, ${d} ${months[m - 1]} ${y}`
}

export function formatDateTime(isoDate: string, time: string): string {
  return `${formatDateHeading(isoDate)} · ${time}`
}
