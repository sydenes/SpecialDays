import { getStockPhotosForCategory } from '../../lib/defaultPhotos.js'
import { stockPhotoSrc } from '../../lib/defaultPhotos.js'
import { serializePageComponents } from '../../lib/pageComponents.js'

const DEMO_COPY = {
  wedding: {
    title: 'Elif & Mert Nişan',
    mainText: 'Bu özel günümüzde sizleri yanımızda görmekten mutluluk duyarız.',
    themeColor: '#b0425f',
    texts: ['Hikayemiz burada başladı…', 'Program ve detaylar için bizi takip edin.', 'Sevgilerimizle.'],
  },
  birthday: {
    title: 'İyi Ki Doğdun!',
    mainText: 'Bugün senin günün — kutlu olsun!',
    themeColor: '#c9a46a',
    texts: ['Bugün senin günün!', 'Seninle gurur duyuyoruz.', 'İyi ki doğdun.'],
  },
  anniversary: {
    title: 'Yıldönümümüz',
    mainText: 'Birlikte geçirdiğimiz her an için teşekkürler.',
    themeColor: '#8b2942',
    texts: ['Birlikte nice yıllara…', 'Bu akşamı sizinle kutlamak istiyoruz.', 'Sevgiyle.'],
  },
  default: {
    title: 'Özel Gün Kutlaması',
    mainText: 'Bu özel günde sizleri aramızda görmekten mutluluk duyarız.',
    themeColor: '#c41e3a',
    texts: ['Davet metniniz burada.', 'Detaylar yakında.', 'Sevgilerimizle.'],
  },
}

function demoEventDateIso() {
  const d = new Date()
  d.setMonth(d.getMonth() + 2)
  d.setHours(19, 30, 0, 0)
  return d.toISOString()
}

/**
 * Şablon seçim ekranı için örnek sayfa verisi.
 */
export function buildTemplateDemoDraft(template, categoryCode) {
  const key = typeof categoryCode === 'string' ? categoryCode.trim().toLowerCase() : ''
  const copy = DEMO_COPY[key] || DEMO_COPY.default
  const stock = getStockPhotosForCategory(key || 'shared')
  const cat = key && stock.length ? key : 'shared'
  const photos = stock.slice(0, 4).map((s, i) => {
    const src = stockPhotoSrc(cat, s)
    return {
      id: `demo-${s.id}`,
      fileUrl: src,
      thumbnailUrl: src,
      sortOrder: i + 1,
    }
  })

  const blocks = template?.configSchema?.textBlocks || []
  const texts = blocks.map((b, i) => ({
    id: `demo-text-${b.key}`,
    blockKey: b.key,
    content: copy.texts[i] || copy.texts.at(-1) || '',
    sortOrder: i + 1,
  }))

  return {
    page: {
      title: copy.title,
      mainText: copy.mainText,
      eventDate: demoEventDateIso(),
      settings: { themeColor: copy.themeColor, musicUrl: '' },
      templateConfigSchema: template?.configSchema || {},
    },
    photos,
    texts,
  }
}

/**
 * Create / edit formundan canlı önizleme verisi.
 */
export function buildFormPreviewDraft({
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
}) {
  let eventIso = null
  if (eventDate) {
    const d = new Date(eventDate)
    if (!Number.isNaN(d.getTime())) eventIso = d.toISOString()
  }

  const components = serializePageComponents(pageComponents || {}, template)
  const musicOn = components.music !== false
  const mainOn = components.mainText !== false
  const ibanNorm = giftIban?.replace(/\s+/g, '').toUpperCase() || ''
  const hasLocation = Boolean(locationVenueName?.trim() || locationAddress?.trim())

  const page = {
    title: title.trim() || 'Sayfa başlığınız',
    mainText: mainOn ? mainText.trim() || 'Karşılama metniniz burada görünecek.' : '',
    eventDate: eventIso,
    settings: {
      themeColor: themeColor?.trim() || '#c41e3a',
      components,
      ...(musicOn
        ? musicId?.trim()
          ? { musicId: musicId.trim() }
          : { musicUrl: musicUrl?.trim() || '' }
        : {}),
      ...(giftEnabled && ibanNorm && components.gift !== false
        ? {
            giftEnabled: true,
            giftBankName: giftBankName?.trim() || '',
            giftRecipientName: giftRecipientName?.trim() || '',
            giftIban: ibanNorm,
          }
        : {}),
      ...(locationEnabled && hasLocation && components.location !== false
        ? {
            locationEnabled: true,
            locationVenueName: locationVenueName?.trim() || '',
            locationAddress: locationAddress?.trim() || '',
            ...(locationLat != null ? { locationLat } : {}),
            ...(locationLon != null ? { locationLon } : {}),
          }
        : {}),
    },
    templateConfigSchema: template?.configSchema || {},
  }

  const photos = (photoItems || []).map((p, i) => ({
    id: p.id,
    fileUrl: p.url,
    thumbnailUrl: p.url,
    sortOrder: i + 1,
  }))

  const texts = (keys || [])
    .filter((blockKey) => components.texts?.[blockKey] !== false)
    .map((blockKey, i) => {
      const content = (textByKey?.[blockKey] || '').trim()
      return {
        id: `preview-${blockKey}`,
        blockKey,
        content: content || '',
        sortOrder: i + 1,
      }
    })
    .filter((t) => t.content)

  return { page, photos, texts }
}
