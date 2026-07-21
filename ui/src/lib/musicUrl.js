import { API_BASE } from './api.js'

/**
 * Müzik kaynağını çalınabilir forma dönüştürür.
 * YouTube linkleri <audio> ile çalmaz — embed gerekir.
 * @param {string} raw
 * @returns {{ type: 'youtube', videoId: string, embedUrl: string } | { type: 'audio', src: string } | null}
 */
export function parseMusicSource(raw) {
  const url = typeof raw === 'string' ? raw.trim() : ''
  if (!url) return null

  const yt =
    url.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/) ||
    url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (yt?.[1]) {
    const videoId = yt[1]
    return {
      type: 'youtube',
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
    }
  }

  return { type: 'audio', src: url }
}

/**
 * Kütüphane parçası için stream URL'si.
 * @param {string} musicId
 */
export function libraryMusicStreamUrl(musicId) {
  const id = typeof musicId === 'string' ? musicId.trim() : ''
  if (!id) return ''
  return `${API_BASE}/api/music/${encodeURIComponent(id)}/file`
}

/**
 * Sayfa settings → oynatıcı URL'si.
 * musicId varsa kütüphane; yoksa özel musicUrl.
 * @param {{ musicId?: unknown, musicUrl?: unknown } | null | undefined} settings
 */
export function resolvePageMusicUrl(settings) {
  if (!settings || typeof settings !== 'object') return ''
  const musicId = typeof settings.musicId === 'string' ? settings.musicId.trim() : ''
  if (musicId) return libraryMusicStreamUrl(musicId)
  return typeof settings.musicUrl === 'string' ? settings.musicUrl.trim() : ''
}

export const MUSIC_URL_HINT =
  'İsterseniz YouTube veya doğrudan ses dosyası linki de ekleyebilirsiniz. Kütüphane seçimi varsa özel bağlantı yerine o kullanılır.'
