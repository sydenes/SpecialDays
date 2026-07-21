import { buildLocationMapsUrl, resolveLocationSettings } from '../../lib/locationSettings.js'

/**
 * @param {{ settings?: Record<string, unknown> | null, className?: string }} props
 */
export function LocationCard({ settings, className = '' }) {
  const loc = resolveLocationSettings(settings)
  if (!loc.enabled) return null

  const mapsUrl = buildLocationMapsUrl(loc)
  const title = loc.venueName || 'Etkinlik mekanı'

  return (
    <section
      className={`published-location-section ${className}`.trim()}
      aria-label="Adres ve yol tarifi"
      data-preview-anchor="preview-location"
    >
      <div className="published-location-card">
        <h3 className="published-location-title">Adres &amp; Yol Tarifi</h3>
        <p className="published-location-venue">{title}</p>
        {loc.address ? <p className="published-location-address">{loc.address}</p> : null}
        {mapsUrl ? (
          <a
            className="published-location-directions"
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Yol tarifi al
          </a>
        ) : null}
      </div>
    </section>
  )
}
