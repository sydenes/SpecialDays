import { Helmet } from 'react-helmet-async'

const DEFAULT = {
  title: 'Special Days',
  description: 'Özel günleriniz için kişisel sayfalar oluşturun ve sevdiklerinizle paylaşın.',
  imageUrl: '',
  pageUrl: '',
}

/**
 * Yayınlanmış sayfa için Open Graph / Twitter kart etiketleri (tarayıcı + bazı uygulamalar).
 * WhatsApp için asıl önizleme API crawler HTML'i üzerinden gelir.
 */
export function PageOgHead({ og }) {
  const meta = { ...DEFAULT, ...og }
  const title = meta.title || DEFAULT.title
  const description = meta.description || DEFAULT.description
  const pageUrl = meta.pageUrl || (typeof window !== 'undefined' ? window.location.href : '')
  const imageUrl = meta.imageUrl || ''

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="tr_TR" />
      <meta property="og:site_name" content="Special Days" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {pageUrl ? <meta property="og:url" content={pageUrl} /> : null}
      {imageUrl ? <meta property="og:image" content={imageUrl} /> : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {imageUrl ? <meta name="twitter:image" content={imageUrl} /> : null}
    </Helmet>
  )
}
