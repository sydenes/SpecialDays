import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { API_BASE } from '../../lib/api.js'

// Vite + Leaflet default marker icon path fix
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

const TR_CENTER = [39.0, 35.2]
const TR_ZOOM = 6

/**
 * Haritada tıklayarak pin koyma.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   initialLat?: number | null,
 *   initialLon?: number | null,
 *   onConfirm: (payload: { lat: number, lon: number, address: string, label: string }) => void,
 * }} props
 */
export function LocationMapPicker({ open, onClose, initialLat, initialLon, onConfirm }) {
  const mapElRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const mapRef = useRef(/** @type {L.Map | null} */ (null))
  const markerRef = useRef(/** @type {L.Marker | null} */ (null))
  const [pin, setPin] = useState(
    /** @type {{ lat: number, lon: number } | null} */ (
      initialLat != null && initialLon != null ? { lat: initialLat, lon: initialLon } : null
    )
  )
  const [resolving, setResolving] = useState(false)
  const [previewAddress, setPreviewAddress] = useState('')

  useEffect(() => {
    if (!open) return undefined
    if (initialLat != null && initialLon != null) {
      setPin({ lat: initialLat, lon: initialLon })
    }
    return undefined
  }, [open, initialLat, initialLon])

  useEffect(() => {
    if (!open || !mapElRef.current) return undefined

    const hasPin = pin != null
    const map = L.map(mapElRef.current, {
      center: hasPin ? [pin.lat, pin.lon] : TR_CENTER,
      zoom: hasPin ? 16 : TR_ZOOM,
      scrollWheelZoom: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    if (hasPin) {
      markerRef.current = L.marker([pin.lat, pin.lon]).addTo(map)
    }

    const onClick = (e) => {
      const { lat, lng } = e.latlng
      setPin({ lat, lon: lng })
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(map)
      }
      map.panTo([lat, lng])
    }
    map.on('click', onClick)

    // layout sonrası boyut düzelt
    const t = window.setTimeout(() => map.invalidateSize(), 80)

    return () => {
      window.clearTimeout(t)
      map.off('click', onClick)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // pin değişince haritayı yeniden kurma — sadece open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open || !pin) {
      setPreviewAddress('')
      return undefined
    }
    let cancelled = false
    setResolving(true)
    ;(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/places/reverse?lat=${encodeURIComponent(pin.lat)}&lon=${encodeURIComponent(pin.lon)}`
        )
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        setPreviewAddress(typeof data.address === 'string' ? data.address : `${pin.lat.toFixed(5)}, ${pin.lon.toFixed(5)}`)
      } catch {
        if (!cancelled) setPreviewAddress(`${pin.lat.toFixed(5)}, ${pin.lon.toFixed(5)}`)
      } finally {
        if (!cancelled) setResolving(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, pin])

  if (!open) return null

  const confirm = async () => {
    if (!pin) return
    setResolving(true)
    try {
      const res = await fetch(
        `${API_BASE}/api/places/reverse?lat=${encodeURIComponent(pin.lat)}&lon=${encodeURIComponent(pin.lon)}`
      )
      const data = await res.json().catch(() => ({}))
      onConfirm({
        lat: pin.lat,
        lon: pin.lon,
        address:
          typeof data.address === 'string' && data.address.trim()
            ? data.address.trim()
            : `${pin.lat.toFixed(5)}, ${pin.lon.toFixed(5)}`,
        label: typeof data.label === 'string' ? data.label : '',
      })
      onClose()
    } finally {
      setResolving(false)
    }
  }

  return (
    <div className="location-map-picker-overlay" role="dialog" aria-modal="true" aria-label="Haritada konum seç">
      <div className="location-map-picker">
        <div className="location-map-picker-head">
          <strong>Haritada işaretle</strong>
          <button type="button" className="btn-link" onClick={onClose}>
            Kapat
          </button>
        </div>
        <p className="form-hint">Haritaya tıklayarak pin koyun. Yol tarifi bu noktaya gidecek.</p>
        <div className="location-map-picker-canvas" ref={mapElRef} />
        <p className="form-hint location-map-picker-address">
          {resolving ? 'Adres çözülüyor…' : previewAddress || 'Henüz pin yok — haritaya tıklayın.'}
        </p>
        <div className="location-map-picker-actions">
          <button type="button" className="btn btn-draft" onClick={onClose}>
            İptal
          </button>
          <button type="button" className="btn btn-publish" disabled={!pin || resolving} onClick={confirm}>
            Bu konumu kullan
          </button>
        </div>
      </div>
    </div>
  )
}
