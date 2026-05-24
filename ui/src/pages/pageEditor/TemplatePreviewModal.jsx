import { useMemo } from 'react'
import { PublishedPageView } from '../published/PublishedPageView.jsx'
import { buildTemplateDemoDraft } from './buildPreviewDraft.js'
import './pageEditor.css'

/**
 * @param {{ template: object, categoryCode?: string, onClose: () => void, onSelect: () => void }} props
 */
export function TemplatePreviewModal({ template, categoryCode, onClose, onSelect }) {
  const draft = useMemo(
    () => buildTemplateDemoDraft(template, categoryCode),
    [template, categoryCode]
  )

  return (
    <div className="template-preview-modal" role="dialog" aria-modal="true" aria-labelledby="template-preview-title">
      <button type="button" className="template-preview-backdrop" onClick={onClose} aria-label="Kapat" />
      <div className="template-preview-panel">
        <header className="template-preview-header">
          <div>
            <h2 id="template-preview-title">{template.name}</h2>
            <p className="template-preview-sub">{template.code}</p>
          </div>
          <button type="button" className="btn template-preview-close" onClick={onClose}>
            Kapat
          </button>
        </header>
        <div className="template-preview-viewport">
          <PublishedPageView
            page={draft.page}
            photos={draft.photos}
            texts={draft.texts}
            previewMode
            embedded
          />
        </div>
        <footer className="template-preview-footer">
          <button type="button" className="btn btn-primary" onClick={onSelect}>
            Bu şablonu seç
          </button>
        </footer>
      </div>
    </div>
  )
}
