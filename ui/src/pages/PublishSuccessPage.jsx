import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { getPublicPageUrl } from '../lib/pageUrl.js'
import './flowPages.css'
import './PublishSuccess.css'

export function PublishSuccessPage() {
  const { slug } = useParams()
  const location = useLocation()
  const pageTitle = location.state?.title || ''
  const wasEdit = Boolean(location.state?.wasEdit)

  const pageUrl = slug ? getPublicPageUrl(slug) : ''
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copyState, setCopyState] = useState('idle')

  useEffect(() => {
    if (!pageUrl) {
      setQrDataUrl('')
      return
    }
    let cancelled = false
    QRCode.toDataURL(pageUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#2a2438', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('')
      })
    return () => {
      cancelled = true
    }
  }, [pageUrl])

  const onCopy = async () => {
    if (!pageUrl) return
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2200)
    } catch {
      setCopyState('error')
      setTimeout(() => setCopyState('idle'), 2200)
    }
  }

  if (!slug) {
    return (
      <section className="flow-section publish-success">
        <p className="error-banner">Geçersiz paylaşım adresi.</p>
        <Link to="/templates">Şablon seç</Link>
      </section>
    )
  }

  const shareText = pageTitle
    ? `${pageTitle} — özel gün sayfamız: ${pageUrl}`
    : `Özel gün sayfamız: ${pageUrl}`
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  return (
    <section className="flow-section publish-success">
      <div className="publish-success-card">
        <p className="publish-success-badge">{wasEdit ? 'Güncellendi' : 'Yayında'}</p>
        <h1>{wasEdit ? 'Değişiklikler kaydedildi' : 'Sayfanız yayında!'}</h1>
        {pageTitle ? <p className="publish-success-title">{pageTitle}</p> : null}
        <p className="flow-lead publish-success-lead">
          Bağlantıyı davetlilerinizle paylaşın. QR kodu yazdırabilir veya mesajla gönderebilirsiniz.
        </p>

        <div className="publish-success-url-row">
          <input className="publish-success-url-input" type="text" readOnly value={pageUrl} aria-label="Sayfa bağlantısı" />
          <button type="button" className="btn btn-primary" onClick={onCopy}>
            {copyState === 'copied' ? 'Kopyalandı' : copyState === 'error' ? 'Kopyalanamadı' : 'Kopyala'}
          </button>
        </div>

        <div className="publish-success-share-grid">
          {qrDataUrl ? (
            <div className="publish-success-qr">
              <img src={qrDataUrl} alt="Sayfa QR kodu" width={220} height={220} />
              <span className="form-hint">QR ile taratınca sayfa açılır</span>
            </div>
          ) : (
            <div className="publish-success-qr publish-success-qr--loading">
              <span className="form-hint">QR oluşturuluyor…</span>
            </div>
          )}

          <div className="publish-success-actions">
            <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-block">
              Sayfayı aç
            </a>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-block">
              WhatsApp ile paylaş
            </a>
            <Link to={`/edit/${slug}`} className="btn btn-secondary btn-block">
              Düzenlemeye dön
            </Link>
            <Link to="/templates" className="btn btn-text-link btn-block">
              Yeni sayfa oluştur
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
