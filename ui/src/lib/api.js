import { clearStoredToken, getStoredToken, setStoredToken } from './authStorage.js'

/**
 * Production: aynı origin (Render Express + ui/dist) → relative '' (CORS yok).
 * Dev: lokal API.
 * VITE_API_URL varsa onu kullan.
 */
function resolveApiBase() {
  const fromEnv = typeof import.meta.env.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL.trim() : ''
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (import.meta.env.PROD) return ''
  return 'http://localhost:4000'
}

export const API_BASE = resolveApiBase()

export function authHeaders(extra = {}) {
  const token = getStoredToken()
  const headers = { ...extra }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

/** JSON istekleri — oturum token'ı otomatik eklenir */
export async function apiFetch(path, options = {}) {
  const headers = authHeaders(options.headers || {})
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  return fetch(`${API_BASE}${path}`, { ...options, headers })
}

export { setStoredToken, clearStoredToken, getStoredToken }
