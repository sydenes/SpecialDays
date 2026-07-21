/**
 * Katılım seçimi — mesaj formu ile birlikte.
 * @param {{
 *   attendanceStatus: '' | 'attending' | 'not_attending' | 'undecided',
 *   setAttendanceStatus: (v: '' | 'attending' | 'not_attending' | 'undecided') => void,
 *   guestCount: string,
 *   setGuestCount: (v: string) => void,
 *   disabled?: boolean,
 *   className?: string,
 *   inputClassName?: string,
 * }} props
 */
export function GuestRsvpFields({
  attendanceStatus,
  setAttendanceStatus,
  guestCount,
  setGuestCount,
  disabled = false,
  className = '',
  inputClassName = '',
}) {
  return (
    <fieldset className={`guest-rsvp ${className}`.trim()} disabled={disabled}>
      <legend className="guest-rsvp-title">Katılımınız</legend>
      <p className="guest-rsvp-lead">Lütfen davetimize katılım durumunuzu bizimle paylaşın.</p>

      <div className="guest-rsvp-options" role="radiogroup" aria-label="Katılım durumu">
        <label className={`guest-rsvp-option ${attendanceStatus === 'attending' ? 'is-selected' : ''}`}>
          <input
            type="radio"
            name="attendanceStatus"
            value="attending"
            checked={attendanceStatus === 'attending'}
            onChange={() => setAttendanceStatus('attending')}
          />
          <span className="guest-rsvp-diamond" aria-hidden />
          <span>Katılacağım</span>
        </label>
        <label className={`guest-rsvp-option ${attendanceStatus === 'not_attending' ? 'is-selected' : ''}`}>
          <input
            type="radio"
            name="attendanceStatus"
            value="not_attending"
            checked={attendanceStatus === 'not_attending'}
            onChange={() => setAttendanceStatus('not_attending')}
          />
          <span className="guest-rsvp-diamond" aria-hidden />
          <span>Katılamayacağım</span>
        </label>
        <label className={`guest-rsvp-option ${attendanceStatus === 'undecided' ? 'is-selected' : ''}`}>
          <input
            type="radio"
            name="attendanceStatus"
            value="undecided"
            checked={attendanceStatus === 'undecided'}
            onChange={() => setAttendanceStatus('undecided')}
          />
          <span className="guest-rsvp-diamond" aria-hidden />
          <span>Belirsiz</span>
        </label>
      </div>

      {attendanceStatus === 'attending' ? (
        <label className="guest-rsvp-extra">
          Kişi sayısı
          <input
            className={inputClassName}
            type="number"
            min={1}
            max={50}
            inputMode="numeric"
            placeholder="Örn. 2"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            required
          />
        </label>
      ) : null}
    </fieldset>
  )
}

export function formatAttendanceLabel(status) {
  if (status === 'attending') return 'Katılacak'
  if (status === 'not_attending') return 'Katılamayacak'
  if (status === 'undecided') return 'Belirsiz'
  return ''
}

export function formatRsvpMeta(message) {
  if (!message?.attendanceStatus) return null
  if (message.attendanceStatus === 'attending') {
    const n = message.guestCount
    return n ? `Katılacak · ${n} kişi` : 'Katılacak'
  }
  if (message.attendanceStatus === 'not_attending') {
    return 'Katılamayacak'
  }
  if (message.attendanceStatus === 'undecided') {
    return 'Belirsiz'
  }
  return null
}
