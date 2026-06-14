import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { photoSrc } from '../../lib/photoUrl.js'
import { stockPhotoSrc } from '../../lib/defaultPhotos.js'
import { fileDedupeKey, labelForKey } from './pageFormUtils.js'
import { getPreviewPageUrl, getPublicPageUrl } from '../../lib/pageUrl.js'
import { MUSIC_URL_HINT } from '../../lib/musicUrl.js'
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
            onChange={(e) => setSlug(e.target.value)}
            placeholder="john-ve-martha"
            autoComplete="off"
          />
          <span className="form-hint">Örn: site.com/john-ve-martha — yalnızca küçük harf, rakam, tire.</span>
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
        <label htmlFor="page-field-main-text">
          Karşılama metni
          <textarea
            id="page-field-main-text"
            name="mainText"
            value={mainText}
            onChange={(e) => setMainText(e.target.value)}
            placeholder="Davet metniniz..."
          />
        </label>

        {keys.map((k) => (
          <label key={k} htmlFor={`page-field-text-${k}`}>
            {labelForKey(template, k)}
            <textarea
              id={`page-field-text-${k}`}
              name={`text_${k}`}
              value={textByKey[k] ?? ''}
              onChange={(e) => setTextByKey((prev) => ({ ...prev, [k]: e.target.value }))}
            />
          </label>
        ))}

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
              {remainingSlots === 0 ? ' — limit doldu.' : remainingSlots != null ? ` — ${remainingSlots} slot kaldı.` : ''}
              {' '}
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
        <label htmlFor="page-field-music-url">
          Müzik bağlantısı (isteğe bağlı)
          <input
            id="page-field-music-url"
            name="musicUrl"
            type="url"
            value={musicUrl}
            onChange={(e) => setMusicUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <span className="form-hint">{MUSIC_URL_HINT}</span>
        </label>

        <div className="form-actions-stack">
          {!isPublished ? (
            <button type="button" className="btn btn-draft btn-block" disabled={submitting} onClick={onSaveDraft}>
              {submitting ? 'Kaydediliyor…' : 'Taslak kaydet'}
            </button>
          ) : null}
          <button type="button" className="btn btn-publish btn-block" disabled={submitting} onClick={onPublish}>
            {submitting
              ? 'Kaydediliyor…'
              : isPublished
                ? 'Değişiklikleri kaydet'
                : 'Yayınla'}
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
          textByKey={textByKey}
          keys={keys}
          photoItems={photoItems}
        />
      </div>
    </section>
  )
}
