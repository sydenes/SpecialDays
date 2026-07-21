import { useEffect, useMemo, useRef } from 'react'
import { PublishedPageView } from '../published/PublishedPageView.jsx'
import { buildFormPreviewDraft } from './buildPreviewDraft.js'
import './pageEditor.css'

/**
 * Form state → canlı sayfa önizlemesi.
 * previewFocus: data-preview-anchor değeri — toggle değişince o bölüme kaydırır.
 */
export function PageLivePreview({
  template,
  title,
  eventDate,
  mainText,
  themeColor,
  musicUrl,
  musicId,
  pageComponents,
  giftEnabled,
  giftBankName,
  giftRecipientName,
  giftIban,
  locationEnabled,
  locationVenueName,
  locationAddress,
  locationLat,
  locationLon,
  textByKey,
  keys,
  photoItems,
  previewFocus = '',
}) {
  const viewportRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const focusSeq = useRef(0)

  const draft = useMemo(
    () =>
      buildFormPreviewDraft({
        template,
        title,
        eventDate,
        mainText,
        themeColor,
        musicUrl,
        musicId,
        pageComponents,
        giftEnabled,
        giftBankName,
        giftRecipientName,
        giftIban,
        locationEnabled,
        locationVenueName,
        locationAddress,
        locationLat,
        locationLon,
        textByKey,
        keys,
        photoItems,
      }),
    [
      template,
      title,
      eventDate,
      mainText,
      themeColor,
      musicUrl,
      musicId,
      pageComponents,
      giftEnabled,
      giftBankName,
      giftRecipientName,
      giftIban,
      locationEnabled,
      locationVenueName,
      locationAddress,
      locationLat,
      locationLon,
      textByKey,
      keys,
      photoItems,
    ]
  )

  useEffect(() => {
    if (!previewFocus) return undefined
    const viewport = viewportRef.current
    if (!viewport) return undefined

    const seq = ++focusSeq.current
    let tries = 0

    const run = () => {
      if (seq !== focusSeq.current) return
      const target =
        viewport.querySelector(`[data-preview-anchor="${previewFocus}"]`) ||
        viewport.querySelector('[data-preview-anchor="preview-hero"]')
      if (!target) {
        if (tries < 10) {
          tries += 1
          window.setTimeout(run, 50)
        }
        return
      }

      const vRect = viewport.getBoundingClientRect()
      const tRect = target.getBoundingClientRect()
      const nextTop = viewport.scrollTop + (tRect.top - vRect.top) - 24
      viewport.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' })

      target.classList.remove('preview-anchor-flash')
      void target.offsetWidth
      target.classList.add('preview-anchor-flash')
      window.setTimeout(() => target.classList.remove('preview-anchor-flash'), 1400)
    }

    const t = window.setTimeout(run, 80)
    return () => window.clearTimeout(t)
  }, [previewFocus])

  if (!template) return null

  return (
    <div className="page-live-preview" aria-label="Canlı önizleme">
      <div className="page-live-preview-head">
        <span className="page-live-preview-label">Canlı önizleme</span>
        <span className="page-live-preview-hint">Yazdıkça güncellenir</span>
      </div>
      <div className="page-live-preview-viewport" ref={viewportRef}>
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
