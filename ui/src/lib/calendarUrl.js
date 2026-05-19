function formatGCalUtc(d) {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export function buildGoogleCalendarUrl(title, iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '#'
  const start = formatGCalUtc(d)
  const end = formatGCalUtc(new Date(d.getTime() + 2 * 60 * 60 * 1000))
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}`
}
