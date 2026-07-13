import { clearStoredToken, getStoredToken, setStoredToken } from './authStorage.js'

export const API_BASE = 'https://special-days.onrender.com' // import.meta.env.VITE_API_URL || 'http://localhost:4000'

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
