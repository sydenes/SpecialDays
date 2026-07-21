import { useMemo } from 'react'
import { formatAttendanceLabel } from './GuestRsvpFields.jsx'

const SLICE_COLORS = {
  attending: '#5c6b4a',
  not_attending: '#8b4a4a',
  undecided: '#c9a46a',
}

const STATUS_ORDER = ['attending', 'not_attending', 'undecided']

/**
 * Misafir defteri katılım oranları — pasta dilimi.
 * @param {{ messages: Array<{ attendanceStatus?: string | null, guestCount?: number | null }> }} props
 */
export function AttendancePieChart({ messages = [] }) {
  const stats = useMemo(() => {
    const counts = { attending: 0, not_attending: 0, undecided: 0 }
    let guestTotal = 0
    let withStatus = 0

    for (const m of messages) {
      const s = m.attendanceStatus
      if (s !== 'attending' && s !== 'not_attending' && s !== 'undecided') continue
      counts[s] += 1
      withStatus += 1
      if (s === 'attending' && typeof m.guestCount === 'number' && m.guestCount > 0) {
        guestTotal += m.guestCount
      }
    }

    return { counts, withStatus, guestTotal }
  }, [messages])

  if (stats.withStatus === 0) {
    return (
      <div className="attendance-pie attendance-pie--empty">
        <p>Henüz katılım bildirimi yok.</p>
      </div>
    )
  }

  let cursor = 0
  const stops = []
  for (const key of STATUS_ORDER) {
    const n = stats.counts[key]
    if (!n) continue
    const start = (cursor / stats.withStatus) * 100
    cursor += n
    const end = (cursor / stats.withStatus) * 100
    stops.push(`${SLICE_COLORS[key]} ${start}% ${end}%`)
  }

  const gradient = `conic-gradient(${stops.join(', ')})`

  return (
    <div className="attendance-pie">
      <div className="attendance-pie-visual" style={{ background: gradient }} aria-hidden />
      <div className="attendance-pie-info">
        <p className="attendance-pie-total">
          <strong>{stats.withStatus}</strong> yanıt
          {stats.guestTotal > 0 ? (
            <span>
              {' '}
              · Katılacak kişi: <strong>{stats.guestTotal}</strong>
            </span>
          ) : null}
        </p>
        <ul className="attendance-pie-legend">
          {STATUS_ORDER.map((key) => {
            const n = stats.counts[key]
            if (!n) return null
            const pct = Math.round((n / stats.withStatus) * 100)
            return (
              <li key={key}>
                <span className="attendance-pie-swatch" style={{ background: SLICE_COLORS[key] }} />
                <span>
                  {formatAttendanceLabel(key)} — {n} ({pct}%)
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
