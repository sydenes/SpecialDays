import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { API_BASE } from '../../lib/api.js'
import { buildGoogleCalendarUrl } from '../../lib/calendarUrl.js'
import { formatEventDateTr } from '../../lib/eventFormat.js'
import { photoSrc } from '../../lib/photoUrl.js'
import { BeautyPublishedLayout } from '../beauty/BeautyPublishedLayout.jsx'
import { PageMusicPlayer } from '../../components/PageMusicPlayer.jsx'
import { resolvePageMusicUrl } from '../../lib/musicUrl.js'
import { isFeatureEnabled, isTextBlockEnabled } from '../../lib/pageComponents.js'
import {
  isLikelyBirthdayPage,
  LAYOUTS_WITH_HERO_THUMB_SWAP,
  resolveHeroPoolMax,
  resolveLayout,
  resolveVisualTheme,
  THEME_WRAP_CLASS,
} from './publishedUtils.js'
import { GuestMessageList } from './GuestMessageList.jsx'
import { GuestRsvpFields } from './GuestRsvpFields.jsx'
import { GiftIbanCard } from './GiftIbanCard.jsx'
import { LocationCard } from './LocationCard.jsx'
import { resolveGiftSettings } from '../../lib/giftSettings.js'
import { resolveLocationSettings } from '../../lib/locationSettings.js'
import '../PublicPage.css'

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

function CountdownRow({ cd, theme, compact }) {
  if (!cd) return null
  return (
    <div
      className={`countdown-row ${compact ? 'countdown-row--compact' : ''}`}
      aria-live="polite"
      data-preview-anchor="preview-countdown"
    >
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
  messages,
  guestError,
  guestSuccess,
  authorName,
  setAuthorName,
  authorEmail,
  setAuthorEmail,
  messageText,
  setMessageText,
  attendanceStatus,
  setAttendanceStatus,
  guestCount,
  setGuestCount,
  posting,
  onSubmit,
  compact,
  previewMode,
  hideHeader = false,
  hideMessages = false,
}) {
  return (
    <div className={`guest-section ${compact ? 'guest-section--compact' : ''}`}>
      {!hideHeader ? (
        <h3>{pageTitle ? `${pageTitle} için mesaj bırakın` : 'Mesaj bırakın'}</h3>
      ) : null}
      {previewMode ? (
        <p className="form-hint published-preview-hint">Önizleme — misafir defteri yayınlandıktan sonra açılır.</p>
      ) : null}
      {!hideMessages && !previewMode && messages?.length > 0 ? (
        <div className="guest-messages-block">
          <h4 className="guest-messages-heading">Mesajlar</h4>
          <GuestMessageList messages={messages} />
        </div>
      ) : null}
      {guestSuccess ? <p className="guest-success">{guestSuccess}</p> : null}
      {guestError ? <p className="published-error published-error--inline">{guestError}</p> : null}
      <form
        className="guest-form"
        onSubmit={(e) => {
          if (previewMode) {
            e.preventDefault()
            return
          }
          onSubmit(e)
        }}
      >
        <input
          type="text"
          placeholder="İsim"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          disabled={previewMode}
          readOnly={previewMode}
        />
        <input
          type="email"
          placeholder="E-posta (isteğe bağlı)"
          value={authorEmail}
          onChange={(e) => setAuthorEmail(e.target.value)}
          disabled={previewMode}
          readOnly={previewMode}
        />
        <GuestRsvpFields
          attendanceStatus={attendanceStatus}
          setAttendanceStatus={setAttendanceStatus}
          guestCount={guestCount}
          setGuestCount={setGuestCount}
          disabled={previewMode}
        />
        <textarea
          placeholder="Mesajınız"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          disabled={previewMode}
          readOnly={previewMode}
        />
        <button type="submit" disabled={posting || previewMode} style={{ background: theme }}>
          {previewMode ? 'Önizleme' : posting ? 'Gönderiliyor...' : 'Gönder'}
        </button>
      </form>
    </div>
  )
}

function SaveTheDateButton({ page, theme, label, previewMode }) {
  if (!page?.eventDate) return null
  const href = buildGoogleCalendarUrl(page.title || 'Etkinlik', page.eventDate)
  return (
    <div className="published-save-date" data-preview-anchor="preview-save-the-date">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="published-cal-btn"
        style={{ borderColor: theme, color: theme }}
        onClick={previewMode ? (e) => e.preventDefault() : undefined}
      >
        {label}
      </a>
    </div>
  )
}

/**
 * @param {{
 *   page: object,
 *   photos: object[],
 *   texts: object[],
 *   slug?: string | null,
 *   previewMode?: boolean,
 *   embedded?: boolean,
 * }} props
 */
export function PublishedPageView({
  page,
  photos,
  texts,
  messages: messagesProp = [],
  slug = null,
  previewMode = false,
  draftPreview = false,
  embedded = false,
}) {
  const prefersReducedMotion = useReducedMotion()
  const [guestError, setGuestError] = useState('')
  const [guestSuccess, setGuestSuccess] = useState('')
  const [localMessages, setLocalMessages] = useState(messagesProp)
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [messageText, setMessageText] = useState('')
  const [attendanceStatus, setAttendanceStatus] = useState('')
  const [guestCount, setGuestCount] = useState('1')
  const [posting, setPosting] = useState(false)
  const [activeHeroIndex, setActiveHeroIndex] = useState(0)

  const textsSorted = useMemo(() => {
    const list = [...(texts || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    return list.filter((t) => !t.blockKey || isTextBlockEnabled(page?.settings, t.blockKey))
  }, [texts, page?.settings])

  const theme =
    (page?.settings && typeof page.settings.themeColor === 'string' && page.settings.themeColor) || '#c41e3a'
  const musicUrl =
    isFeatureEnabled(page?.settings, 'music', page?.templateConfigSchema) ? resolvePageMusicUrl(page?.settings) : ''
  const libraryMusicId =
    page?.settings && typeof page.settings.musicId === 'string' ? page.settings.musicId.trim() : ''
  const autoPlayLibraryMusic = Boolean(libraryMusicId) && !previewMode && !embedded && Boolean(musicUrl)

  const cd = useCountdown(page?.eventDate)
  const layout = page ? resolveLayout(page) : 'split-hero'
  const cfg = page?.templateConfigSchema || {}
  const visualTheme = resolveVisualTheme(cfg)
  const themeWrap = THEME_WRAP_CLASS[visualTheme] || THEME_WRAP_CLASS.default

  const showCountdown =
    isFeatureEnabled(page?.settings, 'countdown', cfg) && page?.eventDate && cd
  const showGuestbook = isFeatureEnabled(page?.settings, 'guestbook', cfg)
  const showSaveTheDate = isFeatureEnabled(page?.settings, 'saveTheDate', cfg)
  const showMainText = isFeatureEnabled(page?.settings, 'mainText', cfg)
  const displayMainText = showMainText ? page?.mainText : ''

  useEffect(() => {
    setLocalMessages(messagesProp)
  }, [messagesProp])

  const heroPoolMax = resolveHeroPoolMax(cfg)
  const heroPool = useMemo(
    () => (photos || []).slice(0, Math.min((photos || []).length, heroPoolMax)),
    [photos, heroPoolMax]
  )

  useEffect(() => {
    setActiveHeroIndex(0)
  }, [page?.title, photos])

  const safeHeroIndex = heroPool.length > 0 ? Math.min(activeHeroIndex, heroPool.length - 1) : 0
  const heroPhoto = heroPool[safeHeroIndex] ?? null
  const thumbPhotos = heroPool.filter((_, i) => i !== safeHeroIndex)
  const restPhotos = (photos || []).length > heroPool.length ? (photos || []).slice(heroPool.length) : []
  const heroThumbSwap = LAYOUTS_WITH_HERO_THUMB_SWAP.has(layout) && thumbPhotos.length > 0

  const onSubmitMessage = async (e) => {
    e.preventDefault()
    if (previewMode || !slug) return
    const name = authorName.trim()
    const text = messageText.trim()
    if (!name || !text) {
      setGuestError('Lütfen isim ve mesaj girin.')
      return
    }
    if (attendanceStatus !== 'attending' && attendanceStatus !== 'not_attending' && attendanceStatus !== 'undecided') {
      setGuestError('Lütfen katılım durumunu seçin.')
      return
    }
    let count = null
    if (attendanceStatus === 'attending') {
      count = Number.parseInt(String(guestCount).trim(), 10)
      if (!Number.isFinite(count) || count < 1) {
        setGuestError('Katılacaksanız kişi sayısı en az 1 olmalıdır.')
        return
      }
      if (count > 50) {
        setGuestError('Kişi sayısı en fazla 50 olabilir.')
        return
      }
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
          attendanceStatus,
          guestCount: attendanceStatus === 'attending' ? count : null,
          declineReason: null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'fail')
      }
      setMessageText('')
      setAuthorName('')
      setAuthorEmail('')
      setAttendanceStatus('')
      setGuestCount('1')
      setGuestSuccess(
        data.notice || 'Mesajınız alındı. Sayfa sahibi onayladıktan sonra burada görünecek.'
      )
    } catch (err) {
      setGuestError(err?.message && err.message !== 'fail' ? err.message : 'Mesaj gönderilemedi.')
      setGuestSuccess('')
    } finally {
      setPosting(false)
    }
  }

  if (!page) {
    return <p className="published-missing">Önizleme için veri yok.</p>
  }

  const embedClass = embedded ? ' published-wrap--embedded' : ''
  const previewClass = previewMode ? ' published-wrap--preview' : ''

  if (layout === 'beauty') {
    return (
      <div
        className={`published-wrap published-wrap--beauty-fullbleed ${themeWrap}${embedClass}${previewClass}`}
        style={{ '--published-accent': theme, maxWidth: '100%', width: '100%', padding: 0 }}
      >
        {previewMode && !draftPreview ? (
          <div className="published-preview-badge" aria-hidden>
            Canlı önizleme
          </div>
        ) : null}
        {musicUrl ? (
          <div data-preview-anchor="preview-music">
            <PageMusicPlayer
              url={musicUrl}
              className="beauty-top-audio"
              variant="inline"
              title={`${page.title || 'Sayfa'} müziği`}
              autoPlay={autoPlayLibraryMusic}
            />
          </div>
        ) : previewMode && isFeatureEnabled(page?.settings, 'music', cfg) ? (
          <p className="published-preview-placeholder" data-preview-anchor="preview-music">
            Müzik seçildiğinde burada çalar
          </p>
        ) : null}
        <BeautyPublishedLayout
          page={page}
          photos={photos || []}
          textsSorted={textsSorted}
          theme={theme}
          cd={cd}
          showCountdown={showCountdown}
          showGuestbook={showGuestbook}
          showMainText={showMainText}
          showSaveTheDate={showSaveTheDate}
          messages={localMessages}
          guestError={guestError}
          guestSuccess={guestSuccess}
          authorName={authorName}
          setAuthorName={setAuthorName}
          authorEmail={authorEmail}
          setAuthorEmail={setAuthorEmail}
          messageText={messageText}
          setMessageText={setMessageText}
          attendanceStatus={attendanceStatus}
          setAttendanceStatus={setAttendanceStatus}
          guestCount={guestCount}
          setGuestCount={setGuestCount}
          posting={posting}
          onSubmitMessage={onSubmitMessage}
          giftSettings={page?.settings}
        />
      </div>
    )
  }

  const wrapClass = ['published-wrap', 'published-wrap--premium', themeWrap, embedClass, previewClass]
    .filter(Boolean)
    .join(' ')
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
      {previewMode && !draftPreview ? (
        <div className="published-preview-badge" aria-hidden>
          Canlı önizleme
        </div>
      ) : null}
      <div className="published-premium-bg" />

      <main className="published-premium-shell">
        <motion.section className="published-premium-hero" {...fadeUp} data-preview-anchor="preview-hero">
          <div className="published-premium-copy">
            <p className="published-overline">{isBirthday ? 'Dogum gunun kutlu olsun' : 'Sonsuz bir aniya davetlisin'}</p>
            <h1>{page.title}</h1>
            {page.eventDate ? <p className="published-date">{formatEventDateTr(page.eventDate)}</p> : null}
            {displayMainText ? (
              <p className="published-main-text" data-preview-anchor="preview-main-text">
                {displayMainText}
              </p>
            ) : previewMode && showMainText ? (
              <p className="published-main-text published-preview-placeholder" data-preview-anchor="preview-main-text">
                Karşılama metni burada görünecek
              </p>
            ) : null}
            {showCountdown ? (
              <CountdownRow cd={cd} theme={theme} />
            ) : previewMode && isFeatureEnabled(page?.settings, 'countdown', cfg) ? (
              <p className="published-preview-placeholder" data-preview-anchor="preview-countdown">
                Geri sayım (etkinlik tarihi gerekli)
              </p>
            ) : null}
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
                  const thumb = <img src={photoSrc(p.thumbnailUrl || p.fileUrl)} alt={p.caption || ''} />
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
            {textsSorted.length === 0 && !previewMode ? (
              <p className="published-story-empty">Bu sayfada henüz ek metin yok.</p>
            ) : null}
            {textsSorted.map((t) => (
              <article
                key={t.id}
                className="published-story-item"
                data-preview-anchor={t.blockKey ? `preview-text-${t.blockKey}` : undefined}
              >
                {t.content}
              </article>
            ))}
            {previewMode
              ? (Array.isArray(cfg.textBlocks) ? cfg.textBlocks : [])
                  .filter((b) => b?.key && isTextBlockEnabled(page?.settings, b.key))
                  .filter((b) => !textsSorted.some((t) => t.blockKey === b.key))
                  .map((b) => (
                    <article
                      key={`ph-${b.key}`}
                      className="published-story-item published-preview-placeholder"
                      data-preview-anchor={`preview-text-${b.key}`}
                    >
                      {b.label || b.key} metni burada
                    </article>
                  ))
              : null}
          </div>
          {!isBirthday && page.eventDate && showSaveTheDate ? (
            <SaveTheDateButton page={page} theme={theme} label={saveLabel} previewMode={previewMode} />
          ) : previewMode && showSaveTheDate ? (
            <p className="published-preview-placeholder" data-preview-anchor="preview-save-the-date">
              Takvime ekle butonu burada
            </p>
          ) : null}
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
          <motion.section className="published-music-section" {...fadeUp} data-preview-anchor="preview-music">
            <div className="published-music-visual" />
            <div className="published-music-content">
              <p>En sevdiğimiz şarkı</p>
              <PageMusicPlayer
                url={musicUrl}
                className="published-audio"
                title={`${page.title || 'Sayfa'} müziği`}
                autoPlay={autoPlayLibraryMusic}
              />
            </div>
          </motion.section>
        ) : previewMode && isFeatureEnabled(page?.settings, 'music', cfg) ? (
          <p className="published-preview-placeholder" data-preview-anchor="preview-music">
            Müzik seçildiğinde burada çalar
          </p>
        ) : null}

        <LocationCard settings={page?.settings} />
        {previewMode &&
        isFeatureEnabled(page?.settings, 'location', cfg) &&
        !resolveLocationSettings(page?.settings).enabled ? (
          <p className="published-preview-placeholder" data-preview-anchor="preview-location">
            Mekan adı / adres girildiğinde konum burada görünür
          </p>
        ) : null}

        <GiftIbanCard settings={page?.settings} />
        {previewMode &&
        isFeatureEnabled(page?.settings, 'gift', cfg) &&
        !resolveGiftSettings(page?.settings).enabled ? (
          <p className="published-preview-placeholder" data-preview-anchor="preview-gift">
            IBAN bilgileri girildiğinde dijital takı burada görünür
          </p>
        ) : null}

        {showGuestbook ? (
          <motion.section
            className="published-message-shell published-message-shell--split"
            {...fadeUp}
            data-preview-anchor="preview-guestbook"
          >
            <div className="published-guestbook-left">
              <div className="published-message-note">
                <h3>{page.title} için bir not bırak</h3>
                <p>Mesajin bu sayfadaki en guzel hatiralardan biri olacak.</p>
              </div>
              {!previewMode && localMessages.length > 0 ? (
                <div className="guest-messages-scroll" aria-label="Onaylı mesajlar">
                  <p className="guest-messages-scroll-label">Mesajlar</p>
                  <GuestMessageList messages={localMessages} />
                </div>
              ) : null}
            </div>
            <GuestBlock
              pageTitle={page.title}
              theme={theme}
              messages={localMessages}
              guestError={guestError}
              guestSuccess={guestSuccess}
              authorName={authorName}
              setAuthorName={setAuthorName}
              authorEmail={authorEmail}
              setAuthorEmail={setAuthorEmail}
              messageText={messageText}
              setMessageText={setMessageText}
              attendanceStatus={attendanceStatus}
              setAttendanceStatus={setAttendanceStatus}
              guestCount={guestCount}
              setGuestCount={setGuestCount}
              posting={posting}
              onSubmit={onSubmitMessage}
              compact
              previewMode={previewMode}
              hideHeader
              hideMessages
            />
          </motion.section>
        ) : null}
      </main>

      {!embedded ? <footer className="published-footer">Iyi ki varsin.</footer> : null}
    </div>
  )
}
