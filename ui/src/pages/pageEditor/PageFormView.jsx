import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { photoSrc } from '../../lib/photoUrl.js'
import { stockPhotoSrc } from '../../lib/defaultPhotos.js'
import { fileDedupeKey } from './pageFormUtils.js'
import { getPreviewPageUrl } from '../../lib/pageUrl.js'
import { ComponentsTogglePanel } from './ComponentsTogglePanel.jsx'
import { PageLivePreview } from './PageLivePreview.jsx'
import { usePreviewPhotoList } from './usePreviewPhotoList.js'
import '../flowPages.css'
import './pageEditor.css'

export function PageFormView({
  isEdit,
  editSlug,
  categoryFromPick,
  template,
  slug,
  setSlug,
  slugCheck,
  title,
  setTitle,
  eventDate,
  setEventDate,
  mainText,
  setMainText,
  themeColor,
  setThemeColor,
  musicUrl,
  setMusicUrl,
  musicId,
  setMusicId,
  pageComponents,
  setPageComponents,
  toggleable,
  giftEnabled,
  giftBankName,
  setGiftBankName,
  giftRecipientName,
  setGiftRecipientName,
  giftIban,
  setGiftIban,
  locationEnabled,
  locationVenueName,
  setLocationVenueName,
  locationAddress,
  setLocationAddress,
  locationLat,
  setLocationLat,
  locationLon,
  setLocationLon,
  keys,
  textByKey,
  setTextByKey,
  maxPhotos,
  totalPhotoCount,
  remainingSlots,
  photoLimitReached,
  existingPhotos,
  photosToDelete,
  photoFiles,
  stockPhotos,
  stockCategory,
  selectedStockIds,
  stockLoadingId,
  submitting,
  formError,
  formInfo,
  dismissError,
  dismissInfo,
  markExistingPhotoDeleted,
  removePhotoAt,
  addPhotoFiles,
  toggleStockPhoto,
  pageStatus,
  previewToken,
  onSaveDraft,
  onPublish,
}) {
  const isPublished = pageStatus === 'published'
  const photoItems = usePreviewPhotoList(existingPhotos, photosToDelete, photoFiles)
  const [previewFocus, setPreviewFocus] = useState('')
  const focusPreview = (anchor) => {
    // Aynı anchor tekrar tıklanınca effect tetiklensin
    setPreviewFocus('')
    requestAnimationFrame(() => setPreviewFocus(`${anchor}#${Date.now()}`))
  }
  const previewFocusAnchor = previewFocus.includes('#') ? previewFocus.split('#')[0] : previewFocus

  const toastLayer =
    (formError || formInfo) &&
    createPortal(
      <div className="flow-toast-layer" aria-live="polite">
        {formError ? (
          <div className="flow-toast flow-toast--error" role="alert">
            <p className="flow-toast-message">{formError}</p>
            <button type="button" className="flow-toast-dismiss" onClick={dismissError} aria-label="Kapat">
              ×
            </button>
          </div>
        ) : null}
        {formInfo ? (
          <div className="flow-toast flow-toast--info">
            <p className="flow-toast-message">{formInfo}</p>
            <button type="button" className="flow-toast-dismiss" onClick={dismissInfo} aria-label="Kapat">
              ×
            </button>
          </div>
        ) : null}
      </div>,
      document.body
    )

  return (
    <section className="flow-section page-editor-section">
      {toastLayer}
      <h1>{isEdit ? 'Sayfanızı düzenleyin' : 'Sayfanızı oluşturun'}</h1>
      <p className="flow-lead">
        Şablon: <strong>{template.name}</strong> ({template.code})
        {isEdit ? (
          <>
            {' '}
            —{' '}
            {isPublished ? (
              <Link to={`/${editSlug}`}>Canlı sayfayı görüntüle</Link>
            ) : previewToken ? (
              <a href={getPreviewPageUrl(editSlug, previewToken)} target="_blank" rel="noopener noreferrer">
                Taslak önizleme
              </a>
            ) : null}
            {pageStatus === 'draft' ? (
              <span className="form-hint page-status-hint"> · Durum: taslak (henüz herkese açık değil)</span>
            ) : (
              <span className="form-hint page-status-hint"> · Durum: yayında</span>
            )}
          </>
        ) : (
          <span className="form-hint page-status-hint">Kayıttan sonra taslak olarak saklanır; yayın ayrı adımdır.</span>
        )}
      </p>

      <div className="page-editor-layout">
        <div className="page-editor-form-col">
          <form className="create-form" onSubmit={(e) => e.preventDefault()} noValidate autoComplete="off">
            <label htmlFor="page-field-slug">
              Sayfa adresi (slug)
              <input
                id="page-field-slug"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="john-ve-martha"
                autoComplete="off"
                aria-describedby="page-field-slug-hint page-field-slug-status"
              />
              <span id="page-field-slug-hint" className="form-hint">
                Örn: specialdays.com/john-ve-martha — yalnızca küçük harf, rakam, tire.
              </span>
              {slugCheck?.status && slugCheck.status !== 'idle' ? (
                <span
                  id="page-field-slug-status"
                  className={`form-hint slug-check slug-check--${slugCheck.status}`}
                  role="status"
                >
                  {slugCheck.message}
                </span>
              ) : (
                <span id="page-field-slug-status" className="visually-hidden" />
              )}
            </label>
            <label htmlFor="page-field-title">
              Sayfa başlığı
              <input
                id="page-field-title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="John & Martha Düğünü"
              />
            </label>
            <label htmlFor="page-field-event-date">
              Etkinlik tarihi
              <input
                id="page-field-event-date"
                name="eventDate"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </label>

            <div className="create-photos-field">
              <label htmlFor="page-field-photos" className="create-photos-label">
                Fotoğraflar
              </label>
              <p className="form-hint create-photos-required">En az bir fotoğraf zorunludur.</p>
              <input
                id="page-field-photos"
                name="photos"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                disabled={photoLimitReached || submitting}
                onChange={(e) => {
                  const add = Array.from(e.target.files || [])
                  e.target.value = ''
                  if (add.length === 0) return
                  addPhotoFiles(add)
                }}
              />
              {typeof maxPhotos === 'number' && (
                <span className="form-hint">
                  {totalPhotoCount} / {maxPhotos} fotoğraf
                  {remainingSlots === 0
                    ? ' — limit doldu.'
                    : remainingSlots != null
                      ? ` — ${remainingSlots} slot kaldı.`
                      : ''}{' '}
                  (JPEG, PNG, WebP, GIF)
                </span>
              )}

              {isEdit && existingPhotos.length > 0 ? (
                <ul className="photo-pick-list photo-pick-list--existing">
                  {existingPhotos
                    .filter((p) => !photosToDelete.has(p.id))
                    .map((p) => (
                      <li key={p.id}>
                        <img
                          className="photo-pick-thumb"
                          src={photoSrc(p.thumbnailUrl || p.fileUrl)}
                          alt={p.caption || ''}
                        />
                        <span>{p.caption || 'Mevcut fotoğraf'}</span>
                        <button
                          type="button"
                          className="btn btn-text-remove"
                          onClick={() => markExistingPhotoDeleted(p.id)}
                        >
                          Kaldır
                        </button>
                      </li>
                    ))}
                </ul>
              ) : null}

              {stockPhotos.length > 0 ? (
                <div className="stock-photo-picker">
                  <p className="stock-photo-picker-title">Hazır görseller</p>
                  <div className="stock-photo-grid" role="group" aria-label="Hazır görseller">
                    {stockPhotos.map((stock) => {
                      const selected = selectedStockIds.has(stock.id)
                      const loading = stockLoadingId === stock.id
                      return (
                        <button
                          key={stock.id}
                          type="button"
                          className={`stock-photo-card ${selected ? 'stock-photo-card--selected' : ''}`}
                          onClick={() => toggleStockPhoto(stock)}
                          disabled={loading || submitting || (photoLimitReached && !selected)}
                          aria-pressed={selected}
                        >
                          <img src={stockPhotoSrc(stockCategory, stock)} alt={stock.label} loading="lazy" />
                          <span className="stock-photo-card-label">{stock.label}</span>
                          {loading ? <span className="stock-photo-card-badge">Yükleniyor…</span> : null}
                          {selected && !loading ? <span className="stock-photo-card-badge">Seçildi</span> : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {photoFiles.length > 0 && (
                <ul className="photo-pick-list">
                  {photoFiles.map((f, i) => (
                    <li key={`${fileDedupeKey(f)}-${i}`}>
                      <span>{f.name.startsWith('stock-') ? 'Hazır görsel' : f.name}</span>
                      <button type="button" className="btn btn-text-remove" onClick={() => removePhotoAt(i)}>
                        Kaldır
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <ComponentsTogglePanel
              editorItems={toggleable?.editorItems || []}
              components={pageComponents}
              setComponents={setPageComponents}
              onPreviewFocus={focusPreview}
              mainText={mainText}
              setMainText={setMainText}
              textByKey={textByKey}
              setTextByKey={setTextByKey}
              musicUrl={musicUrl}
              setMusicUrl={setMusicUrl}
              musicId={musicId}
              setMusicId={setMusicId}
              giftBankName={giftBankName}
              setGiftBankName={setGiftBankName}
              giftRecipientName={giftRecipientName}
              setGiftRecipientName={setGiftRecipientName}
              giftIban={giftIban}
              setGiftIban={setGiftIban}
              locationVenueName={locationVenueName}
              setLocationVenueName={setLocationVenueName}
              locationAddress={locationAddress}
              setLocationAddress={setLocationAddress}
              locationLat={locationLat}
              setLocationLat={setLocationLat}
              locationLon={locationLon}
              setLocationLon={setLocationLon}
            />

            <label htmlFor="page-field-theme-color">
              Tema rengi (isteğe bağlı)
              <input
                id="page-field-theme-color"
                name="themeColor"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                placeholder="#c41e3a"
              />
            </label>

            <div className="form-actions-stack">
              {!isPublished ? (
                <button type="button" className="btn btn-draft btn-block" disabled={submitting} onClick={onSaveDraft}>
                  {submitting ? 'Kaydediliyor…' : 'Taslak kaydet'}
                </button>
              ) : null}
              <button type="button" className="btn btn-publish btn-block" disabled={submitting} onClick={onPublish}>
                {submitting ? 'Kaydediliyor…' : isPublished ? 'Değişiklikleri kaydet' : 'Yayınla'}
              </button>
              {!isPublished ? (
                <p className="form-hint form-actions-hint">
                  Taslak yalnızca size özel önizleme linkiyle görünür. Yayınladıktan sonra davetlilerinizle paylaşın.
                  Ödeme entegrasyonu eklendiğinde yayın, ödeme sonrası açılacak.
                </p>
              ) : null}
            </div>
          </form>

          <p style={{ marginTop: '1.5rem' }}>
            {isEdit ? (
              <Link to="/panom">Panoma dön</Link>
            ) : (
              <Link to={categoryFromPick ? `/templates/${categoryFromPick}` : '/templates'}>Başka şablon</Link>
            )}
          </p>
        </div>

        <PageLivePreview
          template={template}
          title={title}
          eventDate={eventDate}
          mainText={mainText}
          themeColor={themeColor}
          musicUrl={musicUrl}
          musicId={musicId}
          pageComponents={pageComponents}
          giftEnabled={giftEnabled}
          giftBankName={giftBankName}
          giftRecipientName={giftRecipientName}
          giftIban={giftIban}
          locationEnabled={locationEnabled}
          locationVenueName={locationVenueName}
          locationAddress={locationAddress}
          locationLat={locationLat}
          locationLon={locationLon}
          textByKey={textByKey}
          keys={keys}
          photoItems={photoItems}
          previewFocus={previewFocusAnchor}
        />
      </div>
    </section>
  )
}
