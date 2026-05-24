/** Yayınlanan sayfanın tam kamuya açık URL'si */
export function getPublicPageUrl(slug) {
  const s = typeof slug === 'string' ? slug.trim().toLowerCase() : ''
  if (!s) return ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin.replace(/\/$/, '')}/${s}`
}
