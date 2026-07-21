import { useState } from 'react'
import { formatIbanDisplay, resolveGiftSettings } from '../../lib/giftSettings.js'

/**
 * @param {{ settings?: Record<string, unknown> | null, className?: string }} props
 */
export function GiftIbanCard({ settings, className = '' }) {
  const gift = resolveGiftSettings(settings)
  const [copyState, setCopyState] = useState(/** @type {'idle' | 'copied' | 'error'} */ ('idle'))

  if (!gift.enabled) return null

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(gift.iban)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      setCopyState('error')
      setTimeout(() => setCopyState('idle'), 2000)
    }
  }

  return (
    <section
      className={`published-gift-section ${className}`.trim()}
      aria-label="Dijital takı"
      data-preview-anchor="preview-gift"
    >
      <div className="published-gift-card">
        <h3 className="published-gift-title">Dijital Takı / Hediye</h3>
        <p className="published-gift-lead">
          Dilerseniz aşağıdaki IBAN üzerinden takı veya hediye gönderebilirsiniz.
        </p>
        <dl className="published-gift-details">
          {gift.bankName ? (
            <div>
              <dt>Banka</dt>
              <dd>{gift.bankName}</dd>
            </div>
          ) : null}
          {gift.recipientName ? (
            <div>
              <dt>Alıcı</dt>
              <dd>{gift.recipientName}</dd>
            </div>
          ) : null}
          <div className="published-gift-iban-row">
            <dt>IBAN</dt>
            <dd>
              <code className="published-gift-iban">{formatIbanDisplay(gift.iban)}</code>
              <button type="button" className="published-gift-copy" onClick={onCopy}>
                {copyState === 'copied' ? 'Kopyalandı' : copyState === 'error' ? 'Kopyalanamadı' : 'Kopyala'}
              </button>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
