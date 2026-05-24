import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { API_BASE } from '../lib/api.js'
import { buildGoogleCalendarUrl } from '../lib/calendarUrl.js'
import { formatEventDateTr } from '../lib/eventFormat.js'
import { photoSrc } from '../lib/photoUrl.js'
import { BeautyPublishedLayout } from './beauty/BeautyPublishedLayout.jsx'
import './PublicPage.css'

const LAYOUTS = new Set([
  'split-hero',
  'stacked',
  'minimal',
  'magazine',
  'timeline',
  'split-scroll',
  'letter',
  'party',
  'scrapbook',
  'journey',
  'beauty',
])

const THEME_WRAP_CLASS = {
  default: 'published-theme-default',
  elegant: 'published-theme-elegant',
  'minimal-clean': 'published-theme-minimal',
  'wedding-gold': 'published-theme-wedding-gold',
  'party-neon': 'published-theme-party',
  scrapbook: 'published-theme-scrapbook',
  'romantic-burgundy': 'published-theme-journey',
  'letter-parchment': 'published-theme-letter',
  'beauty-templatemo': 'published-theme-default',
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

function resolveLayout(page) {
  const l = page?.templateConfigSchema?.layout
  return typeof l === 'string' && LAYOUTS.has(l) ? l : 'split-hero'
}

function resolveVisualTheme(cfg) {
  const t = cfg?.visualTheme
  return typeof t === 'string' ? t : 'default'
}

function resolveHeroPoolMax(cfg) {
  const rules = cfg?.contentRules
  const explicit = rules?.heroPoolMax
  if (typeof explicit === 'number' && explicit > 0) return Math.min(12, explicit)
  const maxPhotos = rules?.maxPhotos
  if (typeof maxPhotos === 'number' && maxPhotos > 0) return Math.min(12, maxPhotos)
  return 6
}

function isLikelyBirthdayPage(page) {
  const raw = `${page?.title || ''} ${page?.mainText || ''}`.toLocaleLowerCase('tr-TR')
  return /(doğum|dogum|iyi ki doğdun|iyi ki dogdun|birthday)/i.test(raw)
}

function CountdownRow({ cd, theme, compact }) {
  if (!cd) return null
  return (
    <div className={`countdown-row ${compact ? 'countdown-row--compact' : ''}`} aria-live="polite">
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
  )
}

function GuestBlock({
  pageTitle,
  theme,
  guestError,
  authorName,
  setAuthorName,
  authorEmail,
  setAuthorEmail,
  messageText,
  setMessageText,
  posting,
  onSubmit,
  compact,
}) {
  return (
    <div className={`guest-section ${compact ? 'guest-section--compact' : ''}`}>
      <h3>{pageTitle ? `${pageTitle} için mesaj bırakın` : 'Mesaj bırakın'}</h3>
      {guestError ? <p className="published-error published-error--inline">{guestError}</p> : null}
      <form className="guest-form" onSubmit={onSubmit}>
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
  )
}

function SaveTheDateButton({ page, theme, label }) {
  if (!page?.eventDate) return null
  const href = buildGoogleCalendarUrl(page.title || 'Etkinlik', page.eventDate)
  return (
    <div className="published-save-date">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="published-cal-btn"
        style={{ borderColor: theme, color: theme }}
      >
        {label}
      </a>
    </div>
  )
}

export function PublicPage() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [photos, setPhotos] = useState([])
  const [texts, setTexts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [guestError, setGuestError] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [messageText, setMessageText] = useState('')
  const [posting, setPosting] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (!slug) {
      setPage(null)
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setLoadError('')
      try {
        const pageRes = await fetch(`${API_BASE}/api/pages/${slug}`)
        if (!pageRes.ok) {
          if (!cancelled) {
            setLoadError(pageRes.status === 404 ? 'Bu adreste sayfa yok.' : 'Sayfa yüklenemedi.')
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
          setLoadError('Sunucuya bağlanılamadı.')
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

  const textsSorted = useMemo(
    () => [...texts].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [texts]
  )

  const theme =
    (page?.settings && typeof page.settings.themeColor === 'string' && page.settings.themeColor) || '#c41e3a'
  const musicUrl =
    page?.settings && typeof page.settings.musicUrl === 'string' ? page.settings.musicUrl : ''

  const cd = useCountdown(page?.eventDate)
  const layout = page ? resolveLayout(page) : 'split-hero'
  const cfg = page?.templateConfigSchema || {}
  const visualTheme = resolveVisualTheme(cfg)
  const themeWrap = THEME_WRAP_CLASS[visualTheme] || THEME_WRAP_CLASS.default

  const showCountdown = cfg?.components?.countdown !== false && page?.eventDate && cd
  const showGuestbook = cfg?.components?.guestbook !== false

  const [activeHeroIndex, setActiveHeroIndex] = useState(0)

  const heroPoolMax = resolveHeroPoolMax(cfg)
  const heroPool = useMemo(
    () => photos.slice(0, Math.min(photos.length, heroPoolMax)),
    [photos, heroPoolMax]
  )

  useEffect(() => {
    setActiveHeroIndex(0)
  }, [slug, photos])

  const safeHeroIndex = heroPool.length > 0 ? Math.min(activeHeroIndex, heroPool.length - 1) : 0
  const heroPhoto = heroPool[safeHeroIndex] ?? null
  const thumbPhotos = heroPool.filter((_, i) => i !== safeHeroIndex)
  const restPhotos = photos.length > heroPool.length ? photos.slice(heroPool.length) : []
  const heroThumbSwap = layout === 'split-hero' && thumbPhotos.length > 0

  const onSubmitMessage = async (e) => {
    e.preventDefault()
    if (!slug) return
    const name = authorName.trim()
    const text = messageText.trim()
    if (!name || !text) {
      setGuestError('Lütfen isim ve mesaj girin.')
      return
    }
    try {
      setPosting(true)
      setGuestError('')
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
      setGuestError('Mesaj gönderilemedi.')
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
        {loadError ? <p className="published-error">{loadError}</p> : null}
        {!loadError ? <p className="published-missing">Sayfa bulunamadı.</p> : null}
      </div>
    )
  }

  if (layout === 'beauty') {
    return (
      <div
        className={`published-wrap published-wrap--beauty-fullbleed ${themeWrap}`}
        style={{ '--published-accent': theme, maxWidth: '100%', width: '100%', padding: 0 }}
      >
        {musicUrl ? <audio src={musicUrl} controls className="beauty-top-audio" /> : null}
        <BeautyPublishedLayout
          page={page}
          photos={photos}
          textsSorted={textsSorted}
          theme={theme}
          cd={cd}
          showCountdown={showCountdown}
          showGuestbook={showGuestbook}
          guestError={guestError}
          authorName={authorName}
          setAuthorName={setAuthorName}
          authorEmail={authorEmail}
          setAuthorEmail={setAuthorEmail}
          messageText={messageText}
          setMessageText={setMessageText}
          posting={posting}
          onSubmitMessage={onSubmitMessage}
        />
      </div>
    )
  }

  const wrapClass = ['published-wrap', 'published-wrap--premium', themeWrap].filter(Boolean).join(' ')
  const isBirthday = isLikelyBirthdayPage(page)
  const saveLabel =
    (cfg.sectionOptions?.saveTheDate?.label && String(cfg.sectionOptions.saveTheDate.label)) || 'Takvime ekle'
  const fadeUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.28 },
        transition: { duration: 0.65, ease: 'easeOut' },
      }

  return (
    <div className={wrapClass} style={{ '--published-accent': theme }}>
      <div className="published-premium-bg" />
      <header className="published-topbar">
        <a href="/" className="published-brand">
          Special Days
        </a>
        <a href="/" className="published-home-btn">
          Ana sayfa
        </a>
      </header>

      <main className="published-premium-shell">
        <motion.section className="published-premium-hero" {...fadeUp}>
          <div className="published-premium-copy">
            <p className="published-overline">{isBirthday ? 'Dogum gunun kutlu olsun' : 'Sonsuz bir aniya davetlisin'}</p>
            <h1>{page.title}</h1>
            {page.eventDate ? <p className="published-date">{formatEventDateTr(page.eventDate)}</p> : null}
            {page.mainText ? <p className="published-main-text">{page.mainText}</p> : null}
            {showCountdown ? <CountdownRow cd={cd} theme={theme} /> : null}
          </div>
          <div className="published-premium-visual">
            {heroPhoto ? (
              <motion.img
                key={heroPhoto.id}
                className="published-hero-full published-hero-full--premium"
                src={photoSrc(heroPhoto.fileUrl || heroPhoto.thumbnailUrl)}
                alt={heroPhoto.caption || ''}
                initial={prefersReducedMotion ? false : { opacity: 0.4 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            ) : (
              <motion.div className="published-hero-empty-visual" aria-hidden />
            )}
            {thumbPhotos.length > 0 ? (
              <div className="published-floating-thumbs">
                {thumbPhotos.map((p) => {
                  const poolIndex = heroPool.findIndex((x) => x.id === p.id)
                  const thumb = (
                    <img src={photoSrc(p.thumbnailUrl || p.fileUrl)} alt={p.caption || ''} />
                  )
                  if (!heroThumbSwap) {
                    return (
                      <div key={p.id} className="published-floating-thumb-static">
                        {thumb}
                      </div>
                    )
                  }
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className="published-floating-thumb-btn"
                      onClick={() => setActiveHeroIndex(poolIndex)}
                      aria-label={p.caption ? `${p.caption} — büyük göster` : 'Bu fotoğrafı büyük göster'}
                    >
                      {thumb}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        </motion.section>

        <motion.section className="published-story-card" {...fadeUp}>
          <h2>{isBirthday ? 'Bugun senin gunun' : 'Mesajimiz'}</h2>
          <div className="published-story-grid">
            {textsSorted.length === 0 ? (
              <p className="published-story-empty">Bu sayfada henüz ek metin yok.</p>
            ) : (
              textsSorted.map((t) => (
                <article key={t.id} className="published-story-item">
                  {t.content}
                </article>
              ))
            )}
          </div>
          {!isBirthday && page.eventDate ? <SaveTheDateButton page={page} theme={theme} label={saveLabel} /> : null}
        </motion.section>

        {restPhotos.length > 0 ? (
          <motion.section className="published-gallery-section" {...fadeUp}>
            <h3>Anılar</h3>
            <div className="published-masonry-grid published-masonry-grid--premium">
              {restPhotos.map((p) => (
                <img key={p.id} src={photoSrc(p.thumbnailUrl || p.fileUrl)} alt={p.caption || ''} />
              ))}
            </div>
          </motion.section>
        ) : null}

        {musicUrl ? (
          <motion.section className="published-music-section" {...fadeUp}>
            <div className="published-music-visual" />
            <div className="published-music-content">
              <p>En sevdigimiz sarki</p>
              <audio src={musicUrl} controls className="published-audio" />
            </div>
          </motion.section>
        ) : null}

        {showGuestbook ? (
          <motion.section className="published-message-shell" {...fadeUp}>
            <div className="published-message-note">
              <h3>{page.title} için bir not bırak</h3>
              <p>Mesajin bu sayfadaki en guzel hatiralardan biri olacak.</p>
            </div>
            <GuestBlock
              pageTitle={page.title}
              theme={theme}
              guestError={guestError}
              authorName={authorName}
              setAuthorName={setAuthorName}
              authorEmail={authorEmail}
              setAuthorEmail={setAuthorEmail}
              messageText={messageText}
              setMessageText={setMessageText}
              posting={posting}
              onSubmit={onSubmitMessage}
              compact
            />
          </motion.section>
        ) : null}
      </main>

      <footer className="published-footer">Iyi ki varsin.</footer>
    </div>
  )
}
