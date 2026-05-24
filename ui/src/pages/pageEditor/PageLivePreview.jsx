import { useMemo } from 'react'
import { PublishedPageView } from '../published/PublishedPageView.jsx'
import { buildFormPreviewDraft } from './buildPreviewDraft.js'
import './pageEditor.css'

/**
 * Form state → canlı sayfa önizlemesi.
 */
export function PageLivePreview({
  template,
  title,
  eventDate,
  mainText,
  themeColor,
  musicUrl,
  textByKey,
  keys,
  photoItems,
}) {
  const draft = useMemo(
    () =>
      buildFormPreviewDraft({
        template,
        title,
        eventDate,
        mainText,
        themeColor,
        musicUrl,
        textByKey,
        keys,
        photoItems,
      }),
    [template, title, eventDate, mainText, themeColor, musicUrl, textByKey, keys, photoItems]
  )

  if (!template) return null

  return (
    <div className="page-live-preview" aria-label="Canlı önizleme">
      <div className="page-live-preview-head">
        <span className="page-live-preview-label">Canlı önizleme</span>
        <span className="page-live-preview-hint">Yazdıkça güncellenir</span>
      </div>
      <div className="page-live-preview-viewport">
        <PublishedPageView
          page={draft.page}
          photos={draft.photos}
          texts={draft.texts}
          previewMode
          embedded
        />
      </div>
    </div>
  )
}
