export const KEY_LABELS = {
  intro: 'Giriş metni',
  story: 'Hikaye',
  footer: 'Alt bilgi',
  welcome: 'Karşılama',
  details: 'Detaylar',
  fun: 'Sürpriz / eğlence notu',
  message: 'Mesajınız',
}

export function textBlockKeys(template) {
  const rules = template?.configSchema?.contentRules
  const max = parseContentRuleNumber(rules?.maxTexts) ?? 3
  const blocks = template?.configSchema?.textBlocks
  if (Array.isArray(blocks) && blocks.length > 0) {
    const keys = blocks.map((b) => b.key).filter(Boolean)
    return keys.slice(0, Math.max(0, max))
  }
  return Array.from({ length: Math.max(0, max) }, (_, i) => `text-${i + 1}`)
}

export function labelForKey(template, key) {
  const blocks = template?.configSchema?.textBlocks
  if (Array.isArray(blocks)) {
    const b = blocks.find((x) => x.key === key)
    if (b && typeof b.label === 'string') return b.label
  }
  return KEY_LABELS[key] || `Metin: ${key}`
}

export function fileDedupeKey(f) {
  return `${f.name}-${f.size}-${f.lastModified}`
}

export function parseContentRuleNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

/**
 * Kuyrukta tutulabilecek yeni dosya sayısı (mevcut sunucu fotoğrafları hariç).
 * @param {number | undefined} maxPhotos
 * @param {number} keptExistingCount
 * @param {number} queuedCount
 */
export function remainingPhotoSlots(maxPhotos, keptExistingCount, queuedCount) {
  if (typeof maxPhotos !== 'number' || !Number.isFinite(maxPhotos)) return null
  return Math.max(0, maxPhotos - keptExistingCount - queuedCount)
}

/**
 * @param {File[]} prev — henüz yüklenmemiş dosya kuyruğu
 * @param {File[]} incoming
 * @param {number | null | undefined} maxQueueTotal — kuyruğun toplam üst sınırı; null/undefined = 99 (şablon limiti yok)
 */
export function mergePickedFiles(prev, incoming, maxQueueTotal) {
  const limit =
    maxQueueTotal === null || maxQueueTotal === undefined
      ? 99
      : Number.isFinite(maxQueueTotal)
        ? Math.max(0, Math.floor(maxQueueTotal))
        : 99
  if (limit <= 0) return prev
  const seen = new Set(prev.map(fileDedupeKey))
  const out = [...prev]
  for (const f of incoming) {
    if (out.length >= limit) break
    const k = fileDedupeKey(f)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(f)
  }
  return out
}

export function photoLimitMessage(maxPhotos) {
  return `Bu şablonda en fazla ${maxPhotos} fotoğraf kullanabilirsiniz.`
}

export function toDatetimeLocalValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function inferCategoryFromPage(page) {
  const raw = `${page?.title || ''} ${page?.mainText || ''} ${page?.slug || ''}`.toLocaleLowerCase('tr-TR')
  if (/(doğum|dogum|birthday|iyi ki doğdun|iyi ki dogdun)/i.test(raw)) return 'birthday'
  if (/(düğün|dugun|nişan|nisan|wedding)/i.test(raw)) return 'wedding'
  if (/(yıldönüm|yildonum|anniversary)/i.test(raw)) return 'anniversary'
  return 'shared'
}
