import { useEffect, useState } from 'react'
import { API_BASE } from '../../lib/api.js'

/**
 * @typedef {{ id: string, title: string, artist: string, mood?: string | null, available?: boolean, streamUrl?: string }} LibraryTrack
 */

/**
 * @param {{
 *   musicId: string,
 *   onSelectLibrary: (id: string) => void,
 *   onClearLibrary: () => void,
 *   musicUrl: string,
 *   setMusicUrl: (v: string) => void,
 *   musicUrlHint: string,
 * }} props
 */
export function MusicLibraryPicker({
  musicId,
  onSelectLibrary,
  onClearLibrary,
  musicUrl,
  setMusicUrl,
  musicUrlHint,
}) {
  const [tracks, setTracks] = useState(/** @type {LibraryTrack[]} */ ([]))
  const [loadError, setLoadError] = useState('')
  const [previewId, setPreviewId] = useState(/** @type {string | null} */ (null))
  const [showCustom, setShowCustom] = useState(() => Boolean(musicUrl && !musicId))

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/music`)
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) {
          setLoadError('Müzik listesi yüklenemedi.')
          return
        }
        setTracks(Array.isArray(data.tracks) ? data.tracks : [])
      } catch {
        if (!cancelled) setLoadError('Müzik listesi yüklenemedi.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (musicUrl && !musicId) setShowCustom(true)
  }, [musicUrl, musicId])

  return (
    <div className="music-library-picker">
      <div className="music-library-picker-head">
        <span className="music-library-picker-title">Hazır müzik seç (isteğe bağlı)</span>
        {musicId ? (
          <button type="button" className="btn-link music-library-clear" onClick={onClearLibrary}>
            Seçimi kaldır
          </button>
        ) : null}
      </div>
      <p className="form-hint">Telif açısından güvenli varsayılan parçalar. Sayfada yalnızca seçilen parça kaydedilir.</p>

      {loadError ? <p className="form-error-inline">{loadError}</p> : null}

      <div className="music-library-list" role="listbox" aria-label="Hazır müzikler">
        {tracks.map((track) => {
          const selected = musicId === track.id
          const unavailable = track.available === false
          return (
            <div
              key={track.id}
              className={`music-library-row${selected ? ' music-library-row--selected' : ''}${
                unavailable ? ' music-library-row--unavailable' : ''
              }`}
            >
              <button
                type="button"
                role="option"
                aria-selected={selected}
                className="music-library-select"
                disabled={unavailable}
                onClick={() => {
                  onSelectLibrary(track.id)
                  setShowCustom(false)
                  setMusicUrl('')
                }}
              >
                <span className="music-library-track-title">{track.title}</span>
                <span className="music-library-track-meta">
                  {track.artist}
                  {track.mood ? ` · ${track.mood}` : ''}
                  {unavailable ? ' · dosya yok' : ''}
                </span>
              </button>
              {!unavailable ? (
                <button
                  type="button"
                  className="music-library-preview"
                  aria-pressed={previewId === track.id}
                  onClick={() => setPreviewId((prev) => (prev === track.id ? null : track.id))}
                >
                  {previewId === track.id ? 'Durdur' : 'Dinle'}
                </button>
              ) : null}
              {previewId === track.id && track.streamUrl ? (
                <audio
                  className="music-library-audio"
                  src={`${API_BASE}${track.streamUrl}`}
                  controls
                  autoPlay
                  preload="metadata"
                />
              ) : null}
            </div>
          )
        })}
      </div>

      <button
        type="button"
        className="btn-link music-library-custom-toggle"
        onClick={() => setShowCustom((v) => !v)}
      >
        {showCustom ? 'Özel bağlantıyı gizle' : 'Özel bağlantı (YouTube / URL)'}
      </button>

      {showCustom ? (
        <label htmlFor="page-field-music-url" className="music-library-custom-field">
          Müzik bağlantısı
          <input
            id="page-field-music-url"
            name="musicUrl"
            type="url"
            value={musicUrl}
            onChange={(e) => {
              setMusicUrl(e.target.value)
              if (e.target.value.trim()) onClearLibrary()
            }}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <span className="form-hint">{musicUrlHint}</span>
        </label>
      ) : null}
    </div>
  )
}
