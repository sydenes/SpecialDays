import { API_BASE } from './api.js'

/** Harici URL veya API ic yolu (/api/pages/...) */
export function photoSrc(fileUrl) {
  if (!fileUrl) return ''
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl
  const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`
  return `${API_BASE.replace(/\/$/, '')}${path}`
}
