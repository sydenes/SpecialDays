import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatRsvpMeta } from './published/GuestRsvpFields.jsx'
import { AttendancePieChart } from './published/AttendancePieChart.jsx'
import './flowPages.css'
import './myPanel.css'
import './pageGuestbook.css'

function formatWhen(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PageGuestbookPage() {
  const { slug } = useParams()
  const { isAdmin } = useAuth()
  const [page, setPage] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const load = useCallback(async () => {
    if (!slug) return
    setLoading(true)
    setError('')
    try {
      const pageRes = await apiFetch(`/api/me/pages/by-slug/${encodeURIComponent(slug)}`)
      if (!pageRes.ok) {
        setError(pageRes.status === 403 ? 'Bu sayfaya erişim yetkiniz yok.' : 'Sayfa bulunamadı.')
        setPage(null)
        setMessages([])
        return
      }
      const pageData = await pageRes.json()
      const msgRes = await apiFetch(`/api/me/pages/${pageData.id}/messages`)
      const msgData = msgRes.ok ? await msgRes.json() : { items: [] }
      setPage(pageData)
      setMessages(msgData.items || [])
    } catch {
      setError('Sunucuya bağlanılamadı.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    load()
  }, [load])

  const pending = useMemo(() => messages.filter((m) => !m.isApproved), [messages])
  const approved = useMemo(() => messages.filter((m) => m.isApproved), [messages])

  const onApprove = async (messageId) => {
    if (!page) return
    setBusyId(messageId)
    try {
      const res = await apiFetch(`/api/me/pages/${page.id}/messages/${messageId}/approve`, {
        method: 'PATCH',
      })
      if (!res.ok) {
        setError('Onaylanamadı.')
        return
      }
      await load()
    } catch {
      setError('Sunucuya bağlanılamadı.')
    } finally {
      setBusyId('')
    }
  }

  const onDelete = async (messageId) => {
    if (!page || !window.confirm('Bu mesajı silmek istediğinize emin misiniz?')) return
    setBusyId(messageId)
    try {
      const res = await apiFetch(`/api/me/pages/${page.id}/messages/${messageId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        setError('Silinemedi.')
        return
      }
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    } catch {
      setError('Sunucuya bağlanılamadı.')
    } finally {
      setBusyId('')
    }
  }

  if (!slug) {
    return (
      <div className="guestbook-admin">
        <p className="published-error">Geçersiz adres.</p>
        <Link to="/panom">Panoma dön</Link>
      </div>
    )
  }

  return (
    <div className="guestbook-admin">
      <header className="guestbook-admin-head">
        <div>
          <Link to="/panom" className="guestbook-admin-back">
            ← Panom
          </Link>
          <h1>Misafir defteri</h1>
          {page ? (
            <p className="guestbook-admin-sub">
              {page.title} <span className="guestbook-admin-slug">/{page.slug}</span>
            </p>
          ) : null}
        </div>
        {page && !page.deletedAt ? (
          <Link to={`/edit/${page.slug}`} className="btn">
            Sayfayı düzenle
          </Link>
        ) : null}
      </header>

      {error ? <p className="published-error">{error}</p> : null}

      {loading ? (
        <p className="my-panel-muted">Yükleniyor…</p>
      ) : !page ? null : (
        <>
          <section className="guestbook-admin-section guestbook-admin-stats">
            <h2>Katılım oranları</h2>
            <AttendancePieChart messages={messages} />
          </section>

          <section className="guestbook-admin-section">
            <h2>
              Onay bekleyen <span className="guestbook-count">{pending.length}</span>
            </h2>
            {pending.length === 0 ? (
              <p className="guestbook-admin-empty">Bekleyen mesaj yok.</p>
            ) : (
              <ul className="guestbook-admin-list">
                {pending.map((m) => (
                  <li key={m.id} className="guestbook-admin-card guestbook-admin-card--pending">
                    <p className="guestbook-admin-text">{m.messageText}</p>
                    {formatRsvpMeta(m) ? (
                      <p className="guestbook-admin-rsvp">{formatRsvpMeta(m)}</p>
                    ) : null}
                    <p className="guestbook-admin-meta">
                      <strong>{m.authorName}</strong>
                      {m.authorEmail ? <span>{m.authorEmail}</span> : null}
                      <span>{formatWhen(m.createdAt)}</span>
                    </p>
                    <div className="guestbook-admin-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={busyId === m.id}
                        onClick={() => onApprove(m.id)}
                      >
                        {busyId === m.id ? '…' : 'Onayla'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-outline"
                        disabled={busyId === m.id}
                        onClick={() => onDelete(m.id)}
                      >
                        Sil
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="guestbook-admin-section">
            <h2>
              Yayında <span className="guestbook-count">{approved.length}</span>
            </h2>
            {approved.length === 0 ? (
              <p className="guestbook-admin-empty">Henüz onaylı mesaj yok.</p>
            ) : (
              <ul className="guestbook-admin-list">
                {approved.map((m) => (
                  <li key={m.id} className="guestbook-admin-card">
                    <p className="guestbook-admin-text">{m.messageText}</p>
                    {formatRsvpMeta(m) ? (
                      <p className="guestbook-admin-rsvp">{formatRsvpMeta(m)}</p>
                    ) : null}
                    <p className="guestbook-admin-meta">
                      <strong>{m.authorName}</strong>
                      <span>{formatWhen(m.createdAt)}</span>
                    </p>
                    <div className="guestbook-admin-actions">
                      <button
                        type="button"
                        className="btn btn-danger-outline"
                        disabled={busyId === m.id}
                        onClick={() => onDelete(m.id)}
                      >
                        {busyId === m.id ? '…' : 'Sil'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {isAdmin ? (
            <p className="guestbook-admin-hint">
              Yönetici olarak bu sayfanın mesajlarını moderasyon yapıyorsunuz.
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
