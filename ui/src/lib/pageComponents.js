/**
 * @param {unknown} template
 * @returns {{ key: string, label?: string }[]}
 */
function templateTextBlocks(template) {
  const raw = template?.configSchema?.textBlocks
  if (!Array.isArray(raw)) return []
  return raw.filter((b) => b && typeof b.key === 'string' && b.key.trim())
}

/**
 * @typedef {{ id: string, label: string, desc: string }} FeatureDef
 * @typedef {{
 *   music?: boolean,
 *   guestbook?: boolean,
 *   gift?: boolean,
 *   location?: boolean,
 *   countdown?: boolean,
 *   saveTheDate?: boolean,
 *   mainText?: boolean,
 *   texts?: Record<string, boolean>,
 * }} PageComponentsState
 */

/** @type {FeatureDef[]} */
const CORE_FEATURES = [
  {
    id: 'mainText',
    label: 'Karşılama metni',
    desc: 'Hero / girişteki ana davet paragrafı.',
  },
  {
    id: 'countdown',
    label: 'Geri sayım',
    desc: 'Etkinlik tarihine kalan süre.',
  },
  {
    id: 'saveTheDate',
    label: 'Takvime ekle',
    desc: 'Google Takvim bağlantısı / kaydet butonu.',
  },
  {
    id: 'music',
    label: 'Müzik',
    desc: 'Hazır kütüphane veya özel bağlantı.',
  },
  {
    id: 'location',
    label: 'Adres ve yol tarifi',
    desc: 'Organizasyon mekanı adı, adres ve harita linki.',
  },
  {
    id: 'gift',
    label: 'Dijital takı / hediye',
    desc: 'IBAN ile takı veya hediye paylaşımı.',
  },
  {
    id: 'guestbook',
    label: 'Misafir defteri',
    desc: 'Mesaj kutusu ve katılım (RSVP) formu.',
  },
]

/** @type {Record<string, FeatureDef>} */
const FEATURE_BY_ID = Object.fromEntries(CORE_FEATURES.map((f) => [f.id, f]))

/**
 * Premium (split-hero / stacked / minimal): sayfa sırası.
 * textBlocks countdown ile saveTheDate arasında.
 */
const PREMIUM_EDITOR_SLOTS = [
  { kind: 'feature', id: 'mainText' },
  { kind: 'feature', id: 'countdown' },
  { kind: 'texts' },
  { kind: 'feature', id: 'saveTheDate' },
  { kind: 'feature', id: 'music' },
  { kind: 'feature', id: 'location' },
  { kind: 'feature', id: 'gift' },
  { kind: 'feature', id: 'guestbook' },
]

/**
 * Beauty: müzik en üstte; textBlocks hero içinde dağılmış.
 */
const BEAUTY_EDITOR_SLOTS = [
  { kind: 'feature', id: 'music' },
  { kind: 'feature', id: 'countdown' },
  { kind: 'text', key: 'intro' },
  { kind: 'feature', id: 'mainText' },
  { kind: 'feature', id: 'saveTheDate' },
  { kind: 'text', key: 'story' },
  { kind: 'text', key: 'details' },
  { kind: 'text', key: 'footer' },
  { kind: 'feature', id: 'location' },
  { kind: 'feature', id: 'gift' },
  { kind: 'feature', id: 'guestbook' },
]

/**
 * Şablon takvim CTA destekliyor mu?
 * @param {Record<string, unknown> | null | undefined} cfg
 */
export function templateSupportsSaveTheDate(cfg) {
  if (!cfg || typeof cfg !== 'object') return true
  const sections = Array.isArray(cfg.sections) ? cfg.sections : []
  if (sections.includes('saveTheDate') || sections.includes('beauty')) return true
  if (cfg.sectionOptions && typeof cfg.sectionOptions === 'object' && cfg.sectionOptions.saveTheDate) {
    return true
  }
  const layout = typeof cfg.layout === 'string' ? cfg.layout : ''
  return layout === 'minimal' || layout === 'beauty' || layout === 'split-hero' || layout === 'stacked'
}

/**
 * @typedef {{ kind: 'feature', id: string, label: string, desc: string }
 *   | { kind: 'text', key: string, label: string }} EditorToggleItem
 */

/**
 * Editörde gösterilecek toggle listesi (şablon yeteneklerine göre).
 * `editorItems` yayın/önizleme sayfa sırasına yakındır.
 * @param {unknown} template
 * @returns {{
 *   features: FeatureDef[],
 *   textBlocks: { key: string, label: string }[],
 *   editorItems: EditorToggleItem[],
 * }}
 */
export function listToggleableForTemplate(template) {
  const cfg = template?.configSchema || {}
  const tplComponents = cfg.components && typeof cfg.components === 'object' ? cfg.components : {}

  /** @type {FeatureDef[]} */
  const features = []
  for (const f of CORE_FEATURES) {
    if (f.id === 'countdown' && tplComponents.countdown === false) continue
    if (f.id === 'guestbook' && tplComponents.guestbook === false) continue
    if (f.id === 'saveTheDate' && !templateSupportsSaveTheDate(cfg)) continue
    features.push(f)
  }

  const textBlocks = templateTextBlocks(template).map((b) => ({
    key: String(b.key).trim(),
    label: typeof b.label === 'string' && b.label.trim() ? b.label.trim() : String(b.key),
  }))

  const featureIds = new Set(features.map((f) => f.id))
  const textByKey = Object.fromEntries(textBlocks.map((b) => [b.key, b]))
  const usedTextKeys = new Set()
  const usedFeatureIds = new Set()

  const isBeauty = cfg.layout === 'beauty'
  const slots = isBeauty ? BEAUTY_EDITOR_SLOTS : PREMIUM_EDITOR_SLOTS

  /** @type {EditorToggleItem[]} */
  const editorItems = []

  const pushFeature = (id) => {
    if (!featureIds.has(id) || usedFeatureIds.has(id)) return
    const f = FEATURE_BY_ID[id]
    if (!f) return
    usedFeatureIds.add(id)
    editorItems.push({ kind: 'feature', id: f.id, label: f.label, desc: f.desc })
  }

  const pushText = (key) => {
    const b = textByKey[key]
    if (!b || usedTextKeys.has(key)) return
    usedTextKeys.add(key)
    editorItems.push({ kind: 'text', key: b.key, label: b.label })
  }

  const pushAllTexts = () => {
    for (const b of textBlocks) pushText(b.key)
  }

  for (const slot of slots) {
    if (slot.kind === 'feature') pushFeature(slot.id)
    else if (slot.kind === 'text') pushText(slot.key)
    else if (slot.kind === 'texts') pushAllTexts()
  }

  // Şemada olup slot listesinde olmayanları sona ekle
  for (const f of features) pushFeature(f.id)
  for (const b of textBlocks) pushText(b.key)

  return { features, textBlocks, editorItems }
}

/**
 * Yeni sayfa / şablon için varsayılan: hepsi açık.
 * @param {unknown} template
 * @returns {PageComponentsState}
 */
export function defaultPageComponents(template) {
  const { features, textBlocks } = listToggleableForTemplate(template)
  /** @type {PageComponentsState} */
  const next = { texts: {} }
  for (const f of features) {
    // Dijital takı / konum varsayılan kapalı; diğerleri açık
    next[f.id] = f.id === 'gift' || f.id === 'location' ? false : true
  }
  for (const b of textBlocks) next.texts[b.key] = true
  return next
}

/**
 * Kayıtlı settings + şablon → tam components state.
 * @param {unknown} settings
 * @param {unknown} template
 * @returns {PageComponentsState}
 */
export function resolvePageComponentsState(settings, template) {
  const base = defaultPageComponents(template)
  const raw =
    settings && typeof settings === 'object' && settings.components && typeof settings.components === 'object'
      ? settings.components
      : null
  if (!raw) return base

  /** @type {PageComponentsState} */
  const next = { texts: { ...base.texts } }
  for (const f of listToggleableForTemplate(template).features) {
    if (typeof raw[f.id] === 'boolean') next[f.id] = raw[f.id]
    else next[f.id] = base[f.id] !== false
  }
  const rawTexts = raw.texts && typeof raw.texts === 'object' ? raw.texts : {}
  for (const key of Object.keys(next.texts || {})) {
    if (typeof rawTexts[key] === 'boolean') next.texts[key] = rawTexts[key]
  }
  return next
}

/**
 * Yayında / önizlemede özellik açık mı?
 * @param {unknown} settings
 * @param {string} featureId
 * @param {Record<string, unknown> | null | undefined} templateCfg
 */
export function isFeatureEnabled(settings, featureId, templateCfg) {
  const raw =
    settings && typeof settings === 'object' && settings.components && typeof settings.components === 'object'
      ? settings.components
      : null
  if (raw && typeof raw[featureId] === 'boolean') return raw[featureId]

  if (featureId === 'countdown' || featureId === 'guestbook') {
    return templateCfg?.components?.[featureId] !== false
  }
  // gift: eski giftEnabled yoksa varsayılan kapalı değil — feature default true;
  // kart yine IBAN ister. Eski sayfalarda giftEnabled false iken kart zaten gizlenir.
  return true
}

/**
 * @param {unknown} settings
 * @param {string} textKey
 */
export function isTextBlockEnabled(settings, textKey) {
  const raw =
    settings && typeof settings === 'object' && settings.components && typeof settings.components === 'object'
      ? settings.components
      : null
  const texts = raw?.texts
  if (texts && typeof texts === 'object' && typeof texts[textKey] === 'boolean') {
    return texts[textKey]
  }
  return true
}

/**
 * Editör önizlemesinde scroll hedefi.
 * @param {string} featureId
 */
export function previewAnchorForFeature(featureId) {
  const map = {
    mainText: 'preview-main-text',
    music: 'preview-music',
    guestbook: 'preview-guestbook',
    location: 'preview-location',
    gift: 'preview-gift',
    countdown: 'preview-countdown',
    saveTheDate: 'preview-save-the-date',
  }
  return map[featureId] || 'preview-hero'
}

/**
 * @param {string} textKey
 */
export function previewAnchorForText(textKey) {
  return `preview-text-${textKey}`
}

/**
 * API’ye yazılacak sade components objesi.
 * @param {PageComponentsState} state
 * @param {unknown} template
 */
export function serializePageComponents(state, template) {
  const { features, textBlocks } = listToggleableForTemplate(template)
  /** @type {PageComponentsState} */
  const out = { texts: {} }
  for (const f of features) {
    out[f.id] = state?.[f.id] !== false
  }
  for (const b of textBlocks) {
    out.texts[b.key] = state?.texts?.[b.key] !== false
  }
  return out
}
