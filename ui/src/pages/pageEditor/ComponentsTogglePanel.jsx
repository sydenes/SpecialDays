import { MUSIC_URL_HINT } from '../../lib/musicUrl.js'
import { previewAnchorForFeature, previewAnchorForText } from '../../lib/pageComponents.js'
import { MusicLibraryPicker } from './MusicLibraryPicker.jsx'
import { GiftSettingsPanel } from './GiftSettingsPanel.jsx'
import { LocationSettingsPanel } from './LocationSettingsPanel.jsx'

/**
 * Her toggle satırının hemen altında ilgili alanlar açılır.
 * Sıra yayın/önizleme sayfasıyla uyumlu `editorItems` listesinden gelir.
 *
 * @param {{
 *   editorItems: import('../../lib/pageComponents.js').EditorToggleItem[],
 *   components: import('../../lib/pageComponents.js').PageComponentsState,
 *   setComponents: (updater: any) => void,
 *   onPreviewFocus?: (anchor: string) => void,
 *   mainText: string,
 *   setMainText: (v: string) => void,
 *   textByKey: Record<string, string>,
 *   setTextByKey: (updater: any) => void,
 *   musicUrl: string,
 *   setMusicUrl: (v: string) => void,
 *   musicId: string,
 *   setMusicId: (v: string) => void,
 *   giftBankName: string,
 *   setGiftBankName: (v: string) => void,
 *   giftRecipientName: string,
 *   setGiftRecipientName: (v: string) => void,
 *   giftIban: string,
 *   setGiftIban: (v: string) => void,
 *   locationVenueName: string,
 *   setLocationVenueName: (v: string) => void,
 *   locationAddress: string,
 *   setLocationAddress: (v: string) => void,
 *   locationLat: number | null,
 *   setLocationLat: (v: number | null) => void,
 *   locationLon: number | null,
 *   setLocationLon: (v: number | null) => void,
 * }} props
 */
export function ComponentsTogglePanel({
  editorItems,
  components,
  setComponents,
  onPreviewFocus,
  mainText,
  setMainText,
  textByKey,
  setTextByKey,
  musicUrl,
  setMusicUrl,
  musicId,
  setMusicId,
  giftBankName,
  setGiftBankName,
  giftRecipientName,
  setGiftRecipientName,
  giftIban,
  setGiftIban,
  locationVenueName,
  setLocationVenueName,
  locationAddress,
  setLocationAddress,
  locationLat,
  setLocationLat,
  locationLon,
  setLocationLon,
}) {
  const focus = (anchor) => {
    if (typeof onPreviewFocus === 'function') onPreviewFocus(anchor)
  }

  const setFeature = (id, on) => {
    setComponents((prev) => ({ ...prev, [id]: on }))
    if (on) focus(previewAnchorForFeature(id))
  }

  const setText = (key, on) => {
    setComponents((prev) => ({
      ...prev,
      texts: { ...(prev.texts || {}), [key]: on },
    }))
    if (on) focus(previewAnchorForText(key))
  }

  const renderFeatureBody = (id) => {
    switch (id) {
      case 'mainText':
        return (
          <label htmlFor="page-field-main-text" className="components-toggle-field">
            Karşılama metni
            <textarea
              id="page-field-main-text"
              name="mainText"
              value={mainText}
              onChange={(e) => setMainText(e.target.value)}
              placeholder="Davet metniniz..."
            />
          </label>
        )
      case 'music':
        return (
          <div className="components-toggle-field">
            <MusicLibraryPicker
              musicId={musicId}
              onSelectLibrary={setMusicId}
              onClearLibrary={() => setMusicId('')}
              musicUrl={musicUrl}
              setMusicUrl={setMusicUrl}
              musicUrlHint={MUSIC_URL_HINT}
            />
          </div>
        )
      case 'gift':
        return (
          <div className="components-toggle-field">
            <GiftSettingsPanel
              giftBankName={giftBankName}
              setGiftBankName={setGiftBankName}
              giftRecipientName={giftRecipientName}
              setGiftRecipientName={setGiftRecipientName}
              giftIban={giftIban}
              setGiftIban={setGiftIban}
            />
          </div>
        )
      case 'location':
        return (
          <div className="components-toggle-field">
            <LocationSettingsPanel
              locationVenueName={locationVenueName}
              setLocationVenueName={setLocationVenueName}
              locationAddress={locationAddress}
              setLocationAddress={setLocationAddress}
              locationLat={locationLat}
              setLocationLat={setLocationLat}
              locationLon={locationLon}
              setLocationLon={setLocationLon}
            />
          </div>
        )
      case 'guestbook':
        return (
          <p className="form-hint components-toggle-hint">
            Yayında misafir mesajı ve katılım (RSVP) formu görünür.
          </p>
        )
      case 'countdown':
        return (
          <p className="form-hint components-toggle-hint">
            Etkinlik tarihine göre geri sayım gösterilir. Tarih yukarıdaki alandan ayarlanır.
          </p>
        )
      case 'saveTheDate':
        return (
          <p className="form-hint components-toggle-hint">
            Misafirler etkinliği Google Takvim’e ekleyebilir.
          </p>
        )
      default:
        return null
    }
  }

  const items = Array.isArray(editorItems) ? editorItems : []

  return (
    <div className="components-toggle-panel">
      <div className="components-toggle-panel-head">
        <span className="components-toggle-panel-title">Sayfa bileşenleri</span>
        <span className="form-hint">Sıra önizlemedeki gibi; açtığınız bileşenin ayarları hemen altında çıkar.</span>
      </div>

      <ul className="components-toggle-list">
        {items.map((item) => {
          if (item.kind === 'text') {
            const on = components?.texts?.[item.key] !== false
            return (
              <li
                key={`text-${item.key}`}
                className={`components-toggle-item${on ? ' components-toggle-item--on' : ''}`}
              >
                <div className="components-toggle-row">
                  <div className="components-toggle-copy">
                    <span className="components-toggle-label">{item.label}</span>
                    <span className="components-toggle-desc">Şablon metin alanı</span>
                  </div>
                  <label className="gift-settings-switch">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => setText(item.key, e.target.checked)}
                      aria-label={`${item.label} metnini ${on ? 'kapat' : 'aç'}`}
                      aria-expanded={on}
                    />
                    <span className="gift-settings-switch-ui" />
                  </label>
                </div>
                {on ? (
                  <div className="components-toggle-body">
                    <label htmlFor={`page-field-text-${item.key}`} className="components-toggle-field">
                      {item.label}
                      <textarea
                        id={`page-field-text-${item.key}`}
                        name={`text_${item.key}`}
                        value={textByKey[item.key] ?? ''}
                        onChange={(e) =>
                          setTextByKey((prev) => ({ ...prev, [item.key]: e.target.value }))
                        }
                        placeholder={`${item.label}…`}
                      />
                    </label>
                  </div>
                ) : null}
              </li>
            )
          }

          const on = components?.[item.id] !== false
          const body = on ? renderFeatureBody(item.id) : null
          return (
            <li key={item.id} className={`components-toggle-item${on ? ' components-toggle-item--on' : ''}`}>
              <div className="components-toggle-row">
                <div className="components-toggle-copy">
                  <span className="components-toggle-label">{item.label}</span>
                  <span className="components-toggle-desc">{item.desc}</span>
                </div>
                <label className="gift-settings-switch">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => setFeature(item.id, e.target.checked)}
                    aria-label={`${item.label} bileşenini ${on ? 'kapat' : 'aç'}`}
                    aria-expanded={on}
                  />
                  <span className="gift-settings-switch-ui" />
                </label>
              </div>
              {body ? <div className="components-toggle-body">{body}</div> : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
