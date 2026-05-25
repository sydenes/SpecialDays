import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { getPreviewPageUrl, getPublicPageUrl } from '../lib/pageUrl.js'
import './flowPages.css'
import './PublishSuccess.css'

export function PublishSuccessPage() {
  const { slug } = useParams()
  const location = useLocation()
  const pageTitle = location.state?.title || ''
  const wasEdit = Boolean(location.state?.wasEdit)
  const outcome = location.state?.outcome === 'draft' ? 'draft' : 'published'
  const previewToken = location.state?.previewToken || ''

  const isDraft = outcome === 'draft'
  const pageUrl = !isDraft && slug ? getPublicPageUrl(slug) : ''
  const previewUrl = isDraft && slug && previewToken ? getPreviewPageUrl(slug, previewToken) : ''
  const shareUrl = isDraft ? previewUrl : pageUrl

  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copyState, setCopyState] = useState('idle')

  useEffect(() => {
    if (!shareUrl) {
      setQrDataUrl('')
      return
    }
    let cancelled = false
    QRCode.toDataURL(shareUrl, {
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
  }, [shareUrl])

  const onCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
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
        <p className="error-banner">Geçersiz adres.</p>
        <Link to="/templates">Şablon seç</Link>
      </section>
    )
  }

  const shareText = pageTitle
    ? isDraft
      ? `${pageTitle} — taslak önizleme: ${shareUrl}`
      : `${pageTitle} — özel gün sayfamız: ${shareUrl}`
    : isDraft
      ? `Taslak önizleme: ${shareUrl}`
      : `Özel gün sayfamız: ${shareUrl}`
  const whatsappHref = shareUrl ? `https://wa.me/?text=${encodeURIComponent(shareText)}` : '#'

  return (
    <section className="flow-section publish-success">
      <div className="publish-success-card">
        <p className={`publish-success-badge ${isDraft ? 'publish-success-badge--draft' : ''}`}>
          {isDraft ? 'Taslak' : wasEdit ? 'Güncellendi' : 'Yayında'}
        </p>
        <h1>
          {isDraft
            ? 'Taslak kaydedildi'
            : wasEdit
              ? 'Değişiklikler kaydedildi'
              : 'Sayfanız yayında!'}
        </h1>
        {pageTitle ? <p className="publish-success-title">{pageTitle}</p> : null}
        <p className="flow-lead publish-success-lead">
          {isDraft ? (
            <>
              Sayfa henüz herkese açık değil. Aşağıdaki <strong>gizli önizleme linki</strong> yalnızca sizde; sevgilinize
              veya arkadaşınıza <strong>yayın linkini</strong> ödeme sonrası göndereceksiniz.
            </>
          ) : (
            <>Bağlantıyı davetlilerinizle paylaşın. QR kodu yazdırabilir veya mesajla gönderebilirsiniz.</>
          )}
        </p>

        {isDraft ? (
          <p className="publish-success-note">
            <code>/{slug}</code> adresi şu an 404 verir — bu normal; yayınlanınca açılır.
          </p>
        ) : null}

        <div className="publish-success-url-row">
          <input
            className="publish-success-url-input"
            type="text"
            readOnly
            value={shareUrl}
            aria-label={isDraft ? 'Taslak önizleme bağlantısı' : 'Sayfa bağlantısı'}
          />
          <button type="button" className="btn btn-primary" onClick={onCopy} disabled={!shareUrl}>
            {copyState === 'copied' ? 'Kopyalandı' : copyState === 'error' ? 'Kopyalanamadı' : 'Kopyala'}
          </button>
        </div>

        <div className="publish-success-share-grid">
          {qrDataUrl ? (
            <div className="publish-success-qr">
              <img src={qrDataUrl} alt={isDraft ? 'Önizleme QR kodu' : 'Sayfa QR kodu'} width={220} height={220} />
              <span className="form-hint">{isDraft ? 'Önizleme QR' : 'Paylaşım QR'}</span>
            </div>
          ) : (
            <div className="publish-success-qr publish-success-qr--loading">
              <span className="form-hint">QR oluşturuluyor…</span>
            </div>
          )}

          <div className="publish-success-actions">
            {isDraft && previewUrl ? (
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-block">
                Taslağı önizle
              </a>
            ) : null}
            {!isDraft && pageUrl ? (
              <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-block">
                Sayfayı aç
              </a>
            ) : null}
            {shareUrl ? (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-block">
                {isDraft ? 'Önizleme linkini paylaş (WhatsApp)' : 'WhatsApp ile paylaş'}
              </a>
            ) : null}
            <Link to={`/edit/${slug}`} className="btn btn-secondary btn-block">
              Düzenlemeye dön
            </Link>
            {!isDraft ? (
              <Link to="/templates" className="btn btn-text-link btn-block">
                Yeni sayfa oluştur
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
