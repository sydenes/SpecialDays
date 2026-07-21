/**
 * Dijital takı / IBAN ayarları (page.settings).
 * @typedef {{ enabled: boolean, bankName: string, recipientName: string, iban: string }} GiftSettings
 */

/**
 * @param {unknown} settings
 * @returns {GiftSettings}
 */
export function resolveGiftSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return { enabled: false, bankName: '', recipientName: '', iban: '' }
  }
  const s = /** @type {Record<string, unknown>} */ (settings)
  if (s.components && typeof s.components === 'object' && s.components.gift === false) {
    return { enabled: false, bankName: '', recipientName: '', iban: '' }
  }
  const ibanRaw = typeof s.giftIban === 'string' ? s.giftIban : ''
  const iban = normalizeIban(ibanRaw)
  return {
    enabled: s.giftEnabled === true && iban.length > 0,
    bankName: typeof s.giftBankName === 'string' ? s.giftBankName.trim() : '',
    recipientName: typeof s.giftRecipientName === 'string' ? s.giftRecipientName.trim() : '',
    iban,
  }
}

/** Boşlukları sil, büyük harf */
export function normalizeIban(value) {
  return String(value || '')
    .replace(/\s+/g, '')
    .toUpperCase()
}

/** Görüntüleme: TR00 0000 ... */
export function formatIbanDisplay(iban) {
  const raw = normalizeIban(iban)
  if (!raw) return ''
  return raw.replace(/(.{4})/g, '$1 ').trim()
}
