import { buildGoogleCalendarUrl } from '../../lib/calendarUrl.js'
import { formatEventDateTr } from '../../lib/eventFormat.js'
import { photoSrc } from '../../lib/photoUrl.js'
import './BeautyPublishedLayout.css'

function textByKey(texts, key) {
  const t = texts.find((x) => x.blockKey === key)
  return (t?.content && String(t.content).trim()) || ''
}

function renderStoryBody(raw, HeaderTag = 'h2', headerClass = 'tm-section-2-header tm-mb-45') {
  if (!raw) return <p>Metninizi oluşturma adımında ekleyebilirsiniz.</p>
  const parts = raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length >= 2) {
    return (
      <>
        <HeaderTag className={headerClass}>{parts[0]}</HeaderTag>
        {parts.slice(1).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </>
    )
  }
  return <p>{parts[0] || raw}</p>
}

function IconCrown() {
  return (
    <svg className="tm-welcome-icon-svg" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M5 16L3 7l5.5 3L12 4l3.5 6L21 7l-2 9H5zm2.7 2h8.6l.9-4.5-2.5 1.5L12 15l-2.7-2-2.5-1.5L7.7 18z" />
    </svg>
  )
}

function IconHeart() {
  return (
    <svg className="tm-welcome-icon-svg" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg className="tm-welcome-icon-svg" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  )
}

function BeautyCountdown({ cd }) {
  if (!cd) return null
  return (
    <div className="beauty-countdown" aria-live="polite">
      {[
        ['Gün', cd.days],
        ['Saat', cd.hours],
        ['Dakika', cd.minutes],
        ['Saniye', cd.seconds],
      ].map(([label, val]) => (
        <div key={label} className="beauty-countdown-box">
          {val}
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

export function BeautyPublishedLayout({
  page,
  photos,
  textsSorted,
  theme,
  cd,
  showCountdown,
  showGuestbook,
  guestError,
  authorName,
  setAuthorName,
  authorEmail,
  setAuthorEmail,
  messageText,
  setMessageText,
  posting,
  onSubmitMessage,
}) {
  const intro = textByKey(textsSorted, 'intro')
  const story = textByKey(textsSorted, 'story')
  const details = textByKey(textsSorted, 'details')
  const footer = textByKey(textsSorted, 'footer')

  const bgUrl = (i) => {
    const p = photos[i]
    if (!p) return undefined
    return photoSrc(p.fileUrl || p.thumbnailUrl)
  }

  const calHref = page?.eventDate ? buildGoogleCalendarUrl(page.title || 'Etkinlik', page.eventDate) : '#'
  const eventLabel = page?.eventDate ? formatEventDateTr(page.eventDate) : null

  return (
    <div className="beauty-published" style={{ '--beauty-primary': theme }}>
      <div className="beauty-container">
        <div className="tm-top-bar" />

        <section className="tm-welcome">
          <div className="tm-welcome-left">
            <div className="tm-logo">
              <h1 className="tm-site-name">{page.title}</h1>
            </div>
            <div className="tm-welcome-content">
              <div className="tm-welcome-icons-container">
                <IconCrown />
                <IconHeart />
              </div>
              {showCountdown && cd ? <BeautyCountdown cd={cd} /> : null}
              <h2 className="tm-mb-25">{intro || 'Özel gününüze hoş geldiniz'}</h2>
              {page.mainText ? (
                <p className="tm-font-big">
                  {page.mainText}
                  {page.eventDate ? (
                    <>
                      {' '}
                      <a href={calHref} target="_blank" rel="noopener noreferrer">
                        Takvime ekleyin
                      </a>
                    </>
                  ) : null}
                </p>
              ) : (
                <p className="tm-font-big">
                  Bu sayfayı oluştururken karşılama metninizi ve fotoğraflarınızı ekleyerek zenginleştirebilirsiniz.
                </p>
              )}
              {page.eventDate ? (
                <a href={calHref} className="tm-welcome-link tm-font-big" target="_blank" rel="noopener noreferrer">
                  Devam…
                </a>
              ) : null}
              <div style={{ clear: 'both' }} />
            </div>
          </div>
          <div className="tm-welcome-right" />
        </section>

        <div className="tm-bar-2" />

        <section className="beauty-row tm-section-mb tm-section-2">
          <div className="beauty-col-12">
            <div className="tm-section-2-inner">
              <div className="tm-section-2-left">
                <div
                  className="tm-img-container tm-img-container-1"
                  style={bgUrl(0) ? { backgroundImage: `url(${bgUrl(0)})` } : undefined}
                />
                <div
                  className="tm-img-container tm-img-container-2"
                  style={bgUrl(1) ? { backgroundImage: `url(${bgUrl(1)})` } : undefined}
                />
              </div>
              <div className="tm-section-2-right tm-bg-primary">
                <div className="tm-section-2-text">{renderStoryBody(story, 'h2', 'tm-section-2-header tm-mb-45')}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="beauty-row tm-section-3">
          <div className="beauty-col-12">
            <div className="tm-section-3-inner">
              <div className="tm-section-3-left tm-bg-primary">
                <div className="tm-section-3-text">
                  <IconUsers />
                  <h2 className="tm-section-3-header tm-mb-35">Anılar &amp; detaylar</h2>
                  {details ? (
                    details.includes('\n\n') ? (
                      renderStoryBody(details, 'h3', 'tm-mb-35')
                    ) : (
                      <p>{details}</p>
                    )
                  ) : (
                    <p>Detay metnini (details) oluştururken ekleyin.</p>
                  )}
                  {page.eventDate ? (
                    <a href={calHref} className="d-block tm-welcome-link" target="_blank" rel="noopener noreferrer">
                      Tarih: {eventLabel}
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="tm-section-3-right">
                <div
                  className="tm-img-container tm-img-container-3"
                  style={bgUrl(2) ? { backgroundImage: `url(${bgUrl(2)})` } : undefined}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="beauty-row tm-section-pt tm-section-pb">
          <div className="beauty-col-6 mx-auto text-center">
            <h2 className="tm-text-dark tm-mb-50">BİRLİKTE KUTLUYORUZ</h2>
            <p className="tm-text-light-dark tm-font-big">
              {footer ||
                'Sevdiklerinizle bu özel günü paylaşın; fotoğraf galerisinden anıları görün, aşağıdan not bırakın.'}
            </p>
          </div>
        </section>

        {photos.length > 0 ? (
          <section className="beauty-row tm-section-pb">
            <div className="beauty-col-12 tm-gallery-pad tm-gallery-container mx-auto">
              <h2 className="text-center tm-mb-45 tm-text-dark">Fotoğraf galerisi</h2>
              <div className="grid tm-gallery-scroll">
                {photos.map((p) => (
                  <figure key={p.id} className="effect-lexi tm-gallery-item">
                    <img src={photoSrc(p.thumbnailUrl || p.fileUrl)} alt={p.caption || ''} />
                    <figcaption>
                      <p>{p.caption || 'Anı'}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="beauty-row">
          <div className="beauty-col-7 d-flex tm-contact-left-col">
            <div className="tm-bg-primary tm-contact-left">
              <div className="tm-contact-left-inner">
                <h2 className="text-center tm-mb-40 tm-contact-header">BURADAYIZ</h2>
                <p className="tm-line-height-2 mb-5">
                  {eventLabel
                    ? `Etkinlik: ${eventLabel}`
                    : 'Tarih ve yer bilgisini sayfa ayarlarınızdan ekleyebilirsiniz.'}
                </p>
                {page.eventDate ? (
                  <div className="mb-2 tm-font-normal">
                    <a href={calHref} className="tm-contact-link" target="_blank" rel="noopener noreferrer">
                      Takvime ekle (Google)
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          {showGuestbook ? (
            <div className="beauty-col-4">
              <form className="tm-contact-form" onSubmit={onSubmitMessage}>
                {guestError ? <p className="published-error published-error--inline">{guestError}</p> : null}
                <div className="form-group mb-4">
                  <input
                    type="text"
                    className="beauty-form-control"
                    placeholder="İsim"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group mb-4">
                  <input
                    type="email"
                    className="beauty-form-control"
                    placeholder="E-posta (isteğe bağlı)"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                  />
                </div>
                <div className="form-group mb-4">
                  <textarea
                    rows={6}
                    className="beauty-form-control"
                    placeholder="Mesajınız"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group mb-0">
                  <button type="submit" className="beauty-btn-submit" disabled={posting}>
                    {posting ? '…' : 'Gönder'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </section>

        <footer className="beauty-footer">
          <p>
            Özel gün sayfanız ·{' '}
            <a href="/" rel="noopener noreferrer">
              Special Days
            </a>
          </p>
          <p style={{ fontSize: '0.75rem', opacity: 0.75 }}>
            Tasarım uyarlaması: TemplateMo Beauty (CC / kişisel kullanım koşullarına uygun).
          </p>
        </footer>
      </div>
    </div>
  )
}
