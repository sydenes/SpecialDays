function getOrigin() {
  return typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : ''
}

/** Yayınlanan sayfanın tam kamuya açık URL'si (yalnızca status=published) */
export function getPublicPageUrl(slug) {
  const s = typeof slug === 'string' ? slug.trim().toLowerCase() : ''
  if (!s) return ''
  return `${getOrigin()}/${s}`
}

/** Taslak önizleme — gizli token ile; URL bilen önizleyebilir (auth gelene kadar) */
export function getPreviewPageUrl(slug, previewToken) {
  const s = typeof slug === 'string' ? slug.trim().toLowerCase() : ''
  const t = typeof previewToken === 'string' ? previewToken.trim() : ''
  if (!s || !t) return ''
  return `${getOrigin()}/preview/${s}?token=${encodeURIComponent(t)}`
}
