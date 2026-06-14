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

export const MUSIC_URL_HINT =
  'YouTube veya doğrudan ses dosyası linki (ör. .mp3). YouTube sayfada gömülü oynatıcı olarak açılır.'
