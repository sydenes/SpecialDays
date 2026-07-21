/**
 * Organizasyon konumu (page.settings).
 * @typedef {{
 *   enabled: boolean,
 *   venueName: string,
 *   address: string,
 *   lat: number | null,
 *   lon: number | null,
 * }} LocationSettings
 */

/**
 * @param {unknown} settings
 * @returns {LocationSettings}
 */
export function resolveLocationSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return { enabled: false, venueName: '', address: '', lat: null, lon: null }
  }
  const s = /** @type {Record<string, unknown>} */ (settings)
  if (s.components && typeof s.components === 'object' && s.components.location === false) {
    return { enabled: false, venueName: '', address: '', lat: null, lon: null }
  }

  const venueName = typeof s.locationVenueName === 'string' ? s.locationVenueName.trim() : ''
  const address = typeof s.locationAddress === 'string' ? s.locationAddress.trim() : ''
  const lat = typeof s.locationLat === 'number' && Number.isFinite(s.locationLat) ? s.locationLat : null
  const lon = typeof s.locationLon === 'number' && Number.isFinite(s.locationLon) ? s.locationLon : null
  const hasPlace = Boolean(venueName || address)

  return {
    enabled: s.locationEnabled === true && hasPlace,
    venueName,
    address,
    lat,
    lon,
  }
}

/**
 * Google Haritalar yol tarifi / konum linki.
 * @param {LocationSettings} loc
 */
export function buildLocationMapsUrl(loc) {
  if (!loc) return ''
  if (loc.lat != null && loc.lon != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${loc.lat},${loc.lon}`)}`
  }
  const q = [loc.venueName, loc.address].filter(Boolean).join(', ')
  if (!q) return ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

/**
 * Embed harita (opsiyonel önizleme).
 * @param {LocationSettings} loc
 */
export function buildLocationEmbedUrl(loc) {
  if (!loc || loc.lat == null || loc.lon == null) return ''
  const q = encodeURIComponent(loc.address || loc.venueName || `${loc.lat},${loc.lon}`)
  return `https://maps.google.com/maps?q=${q}&z=15&output=embed`
}
