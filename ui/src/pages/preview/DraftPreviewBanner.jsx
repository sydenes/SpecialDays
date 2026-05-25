import { Link } from 'react-router-dom'

/** Taslak önizleme — altta sabit footer uyarısı (site header'ı ezmez). */
export function DraftPreviewBanner({ slug }) {
  if (!slug) return null

  return (
    <footer className="draft-preview-banner" role="status" aria-live="polite">
      <p className="draft-preview-banner-inner">
        <span className="draft-preview-banner-dot" aria-hidden />
        Sayfanız henüz taslak.
        <Link to={`/edit/${slug}`} className="draft-preview-banner-link">
          Hemen yayınlamak için tıklayın
        </Link>
      </p>
    </footer>
  )
}
