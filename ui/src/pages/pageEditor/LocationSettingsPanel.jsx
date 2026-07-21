import { useEffect, useRef, useState } from 'react'
import { API_BASE } from '../../lib/api.js'
import { LocationMapPicker } from './LocationMapPicker.jsx'

/**
 * @typedef {{ id: string, label: string, address: string, lat: number, lon: number }} PlaceSuggestion
 */

/**
 * Mekan adı + adres arama + haritada pin.
 */
export function LocationSettingsPanel({
  locationVenueName,
  setLocationVenueName,
  locationAddress,
  setLocationAddress,
  locationLat,
  setLocationLat,
  locationLon,
  setLocationLon,
}) {
  const [query, setQuery] = useState(locationAddress || '')
  const [suggestions, setSuggestions] = useState(/** @type {PlaceSuggestion[]} */ ([]))
  const [searching, setSearching] = useState(false)
  const [searchedEmpty, setSearchedEmpty] = useState(false)
  const [open, setOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const wrapRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const reqId = useRef(0)

  useEffect(() => {
    setQuery(locationAddress || '')
  }, [locationAddress])

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setSuggestions([])
      setSearching(false)
      setSearchedEmpty(false)
      return undefined
    }
    if (q === locationAddress.trim() && locationLat != null) {
      setSuggestions([])
      setSearchedEmpty(false)
      return undefined
    }

    const id = ++reqId.current
    setSearching(true)
    setSearchedEmpty(false)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/places/search?q=${encodeURIComponent(q)}`)
        const data = await res.json().catch(() => ({}))
        if (id !== reqId.current) return
        const list = Array.isArray(data.results) ? data.results : []
        setSuggestions(list)
        setOpen(true)
        setSearchedEmpty(list.length === 0)
      } catch {
        if (id === reqId.current) {
          setSuggestions([])
          setSearchedEmpty(true)
        }
      } finally {
        if (id === reqId.current) setSearching(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [query, locationAddress, locationLat])

  const pick = (item) => {
    setLocationAddress(item.address)
    setQuery(item.address)
    setLocationLat(item.lat)
    setLocationLon(item.lon)
    if (!locationVenueName.trim() && item.label) {
      setLocationVenueName(item.label)
    }
    setSuggestions([])
    setOpen(false)
    setSearchedEmpty(false)
  }

  const clearPlace = () => {
    setLocationAddress('')
    setQuery('')
    setLocationLat(null)
    setLocationLon(null)
    setSuggestions([])
    setSearchedEmpty(false)
  }

  const pinned = locationLat != null && locationLon != null

  return (
    <div className="location-settings-panel" ref={wrapRef}>
      <p className="form-hint" style={{ marginTop: 0 }}>
        Etkinliğin gerçekleşeceği mekanı girin. Listede yoksa haritada işaretleyebilirsiniz.
      </p>

      <label htmlFor="page-field-location-venue" className="location-field-label">
        Mekan adı
        <input
          id="page-field-location-venue"
          name="locationVenueName"
          value={locationVenueName}
          onChange={(e) => setLocationVenueName(e.target.value)}
          placeholder="Örn: Sabancı Garden"
          autoComplete="organization"
        />
        <span className="form-hint">Davetiyede görünecek mekan veya salon adı.</span>
      </label>

      <div className="location-address-field">
        <label htmlFor="page-field-location-address" className="location-field-label">
          Açık adres
          <input
            id="page-field-location-address"
            name="locationAddress"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setLocationAddress(e.target.value)
              setLocationLat(null)
              setLocationLon(null)
              setOpen(true)
            }}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="Adres yazın, listeden seçin…"
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <div className="location-address-actions">
          {searchedEmpty && !searching && query.trim().length >= 2 ? (
            <div className="location-empty-hint">
              <p className="form-hint">Listede bulunamadı (bazı mekanlar harita verisinde olmayabilir).</p>
              <button type="button" className="btn btn-draft location-map-open-btn" onClick={() => setMapOpen(true)}>
                Haritada işaretle
              </button>
            </div>
          ) : (
            <button type="button" className="btn-link location-map-link" onClick={() => setMapOpen(true)}>
              {pinned ? 'Haritada konumu değiştir' : 'Haritada işaretle'}
            </button>
          )}
          {searching ? <span className="form-hint location-searching-hint">Aranıyor…</span> : null}
        </div>

        {open && suggestions.length > 0 ? (
          <ul className="location-suggestions" role="listbox" aria-label="Adres önerileri">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button type="button" className="location-suggestion-btn" onClick={() => pick(s)}>
                  <span className="location-suggestion-label">{s.label}</span>
                  <span className="location-suggestion-address">{s.address}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="form-hint location-address-hint">
          Açık adresi listeden seçebilir, kendiniz yazabilir veya harita üzerinden işaretleyebilirsiniz.
        </p>

        {pinned ? (
          <p className="form-hint location-selected-hint">
            Konum pin ile sabitlendi — yol tarifi bu noktaya gidecek.
            <button type="button" className="btn-link" onClick={clearPlace}>
              Temizle
            </button>
          </p>
        ) : null}
      </div>

      <LocationMapPicker
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        initialLat={locationLat}
        initialLon={locationLon}
        onConfirm={({ lat, lon, address, label }) => {
          setLocationLat(lat)
          setLocationLon(lon)
          setLocationAddress(address)
          setQuery(address)
          if (!locationVenueName.trim() && label) setLocationVenueName(label)
          setSearchedEmpty(false)
          setSuggestions([])
        }}
      />
    </div>
  )
}
