const TEMPLATE_IMAGE_BASE = '/images/templates'

/** @typedef {{ id: string, file: string, label: string }} StockPhotoDef */

/** @type {Record<string, StockPhotoDef[]>} */
export const STOCK_PHOTOS_BY_CATEGORY = {
  wedding: [
    { id: 'wedding-01', file: '01.jpg', label: 'Düğün çifti' },
    { id: 'wedding-02', file: '02.jpg', label: 'Kutlama' },
    { id: 'wedding-03', file: '03.jpg', label: 'Romantik an' },
  ],
  birthday: [
    { id: 'birthday-01', file: '01.jpg', label: 'Kutlama' },
    { id: 'birthday-02', file: '02.jpg', label: 'Parti' },
    { id: 'birthday-03', file: '03.jpg', label: 'Anı' },
  ],
  anniversary: [
    { id: 'anniversary-01', file: '01.jpg', label: 'Birlikte' },
    { id: 'anniversary-02', file: '02.jpg', label: 'Özel an' },
    { id: 'anniversary-03', file: '03.jpg', label: 'Davet' },
  ],
  shared: [
    { id: 'shared-01', file: '01.jpg', label: 'Genel 1' },
    { id: 'shared-02', file: '02.jpg', label: 'Genel 2' },
  ],
}

/**
 * @param {string | undefined | null} categoryCode
 * @returns {StockPhotoDef[]}
 */
export function getStockPhotosForCategory(categoryCode) {
  const key = typeof categoryCode === 'string' ? categoryCode.trim().toLowerCase() : ''
  if (key && STOCK_PHOTOS_BY_CATEGORY[key]) {
    return STOCK_PHOTOS_BY_CATEGORY[key]
  }
  return STOCK_PHOTOS_BY_CATEGORY.shared
}

/**
 * @param {string | undefined | null} categoryCode
 * @param {StockPhotoDef} stock
 */
export function stockPhotoSrc(categoryCode, stock) {
  const folder =
    typeof categoryCode === 'string' && STOCK_PHOTOS_BY_CATEGORY[categoryCode.trim().toLowerCase()]
      ? categoryCode.trim().toLowerCase()
      : 'shared'
  return `${TEMPLATE_IMAGE_BASE}/${folder}/${stock.file}`
}

/** Hazır görsel seçiminde oluşturulan dosya adı */
export function stockFileName(stockId) {
  return `stock-${stockId}.jpg`
}

/** @param {string} fileName */
export function stockIdFromFileName(fileName) {
  const m = /^stock-(.+)\.jpe?g$/i.exec(fileName)
  return m ? m[1] : null
}

/**
 * @param {string | undefined | null} categoryCode
 * @param {StockPhotoDef} stock
 * @returns {Promise<File>}
 */
export async function stockImageToFile(categoryCode, stock) {
  const src = stockPhotoSrc(categoryCode, stock)
  const res = await fetch(src)
  if (!res.ok) {
    throw new Error(`Görsel yüklenemedi: ${src}`)
  }
  const blob = await res.blob()
  const type = blob.type || 'image/jpeg'
  return new File([blob], stockFileName(stock.id), { type })
}
