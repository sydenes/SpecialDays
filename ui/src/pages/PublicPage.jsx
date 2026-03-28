import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { API_BASE } from '../lib/api.js'
import { photoSrc } from '../lib/photoUrl.js'
import './PublicPage.css'

function formatEventDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(d)
}

function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!target) return undefined
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [target])

  return useMemo(() => {
    if (!target) return null
    const end = new Date(target).getTime()
    if (Number.isNaN(end)) return null
    const diff = Math.max(0, end - now)
    const s = Math.floor(diff / 1000)
    return {
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
    }
  }, [target, now])
}

export function PublicPage() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [photos, setPhotos] = useState([])
  const [texts, setTexts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [messageText, setMessageText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (!slug) {
      setPage(null)
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const pageRes = await fetch(`${API_BASE}/api/pages/${slug}`)
        if (!pageRes.ok) {
          if (!cancelled) {
            setError(pageRes.status === 404 ? 'Bu adreste sayfa yok.' : 'Sayfa yüklenemedi.')
            setPage(null)
            setPhotos([])
            setTexts([])
          }
          return
        }

        const [pageData, photosRes, textsRes] = await Promise.all([
          pageRes.json(),
          fetch(`${API_BASE}/api/pages/${slug}/photos`),
          fetch(`${API_BASE}/api/pages/${slug}/texts`),
        ])

        if (!photosRes.ok || !textsRes.ok) throw new Error('related')

        const photosData = await photosRes.json()
        const textsData = await textsRes.json()

        if (!cancelled) {
          setPage(pageData)
          setPhotos(photosData.items || [])
          setTexts(textsData.items || [])
        }
      } catch {
        if (!cancelled) {
          setError('Sunucuya bağlanılamadı.')
          setPage(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [slug])

  const theme =
    (page?.settings && typeof page.settings.themeColor === 'string' && page.settings.themeColor) || '#c41e3a'
  const musicUrl =
    page?.settings && typeof page.settings.musicUrl === 'string' ? page.settings.musicUrl : ''

  const cd = useCountdown(page?.eventDate)
  const heroPhoto = photos[0]
  const thumbPhotos = photos.slice(heroPhoto ? 1 : 0)

  const onSubmitMessage = async (e) => {
    e.preventDefault()
    if (!slug) return
    const name = authorName.trim()
    const text = messageText.trim()
    if (!name || !text) {
      setError('Lütfen isim ve mesaj girin.')
      return
    }
    try {
      setPosting(true)
      setError('')
      const res = await fetch(`${API_BASE}/api/pages/${slug}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: name,
          authorEmail: authorEmail.trim() || null,
          messageText: text,
        }),
      })
      if (!res.ok) throw new Error('fail')
      setMessageText('')
    } catch {
      setError('Mesaj gönderilemedi.')
    } finally {
      setPosting(false)
    }
  }

  if (!slug) {
    return <div className="published-missing">Geçersiz adres.</div>
  }

  if (loading) {
    return <div className="published-loading">Yükleniyor...</div>
  }

  if (!page) {
    return (
      <div className="published-wrap">
        {error && <p className="published-error">{error}</p>}
        {!error && <p className="published-missing">Sayfa bulunamadı.</p>}
      </div>
    )
  }

  return (
    <div className="published-wrap" style={{ '--published-accent': theme }}>
      {musicUrl ? (
        <audio src={musicUrl} controls style={{ display: 'block', margin: '0 auto 1rem', width: '100%', maxWidth: 420 }} />
      ) : null}

      <div className="published-frame">
        <div className="published-hero-top">
          <h1>{page.title}</h1>
          {page.eventDate && <p className="published-date">{formatEventDate(page.eventDate)}</p>}
        </div>

        {page.mainText ? <p className="published-main-text">{page.mainText}</p> : null}

        {page.eventDate && cd && (
          <div className="countdown-row" aria-live="polite">
            {[
              ['Gün', cd.days],
              ['Saat', cd.hours],
              ['Dakika', cd.minutes],
              ['Saniye', cd.seconds],
            ].map(([label, val]) => (
              <div key={label} className="countdown-box" style={{ background: theme }}>
                {val}
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="published-split">
          <div>
            {heroPhoto ? (
              <img
                className="published-feature-img"
                src={photoSrc(heroPhoto.fileUrl || heroPhoto.thumbnailUrl)}
                alt={heroPhoto.caption || ''}
              />
            ) : (
              <div className="published-feature-img" style={{ display: 'grid', placeItems: 'center', color: '#9a94a8' }}>
                Fotoğraf ekleyin
              </div>
            )}
          </div>
          <div className="published-welcome">
            <h2>Hoş geldiniz</h2>
            {texts.length === 0 ? (
              <p className="block">Bu sayfada henüz ek metin yok.</p>
            ) : (
              texts.map((t) => (
                <p key={t.id} className="block">
                  {t.content}
                </p>
              ))
            )}
            {thumbPhotos.length > 0 && (
              <div className="published-gallery">
                {thumbPhotos.map((p) => (
                  <img key={p.id} src={photoSrc(p.thumbnailUrl || p.fileUrl)} alt={p.caption || ''} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="guest-section">
          <h3>
            {page.title ? `${page.title} için mesaj bırakın` : 'Mesaj bırakın'}
          </h3>
          {error && <p className="published-error">{error}</p>}
          <form className="guest-form" onSubmit={onSubmitMessage}>
            <input type="text" placeholder="İsim" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
            <input
              type="email"
              placeholder="E-posta (isteğe bağlı)"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
            />
            <textarea placeholder="Mesajınız" value={messageText} onChange={(e) => setMessageText(e.target.value)} />
            <button type="submit" disabled={posting} style={{ background: theme }}>
              {posting ? 'Gönderiliyor...' : 'Gönder'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
