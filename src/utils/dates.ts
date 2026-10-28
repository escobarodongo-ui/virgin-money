const dateFormatter = new Intl.DateTimeFormat('en-AU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatDateHeading(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return dateFormatter.format(new Date(y, m - 1, d))
}

export function formatDateTime(isoDate: string, time: string): string {
  return `${formatDateHeading(isoDate)} · ${time}`
}
