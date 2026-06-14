import { useMemo } from 'react'
import { parseMusicSource } from '../lib/musicUrl.js'

/**
 * @param {{ url: string, className?: string, title?: string, variant?: 'inline' | 'section' }} props
 */
export function PageMusicPlayer({ url, className = '', title = 'Sayfa müziği', variant = 'section' }) {
  const source = useMemo(() => parseMusicSource(url), [url])
  if (!source) return null

  if (source.type === 'youtube') {
    return (
      <div className={`page-music-player page-music-player--youtube page-music-player--${variant} ${className}`.trim()}>
        <iframe
          title={title}
          src={source.embedUrl}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <audio
      src={source.src}
      controls
      preload="metadata"
      className={`page-music-player page-music-player--audio page-music-player--${variant} ${className}`.trim()}
    />
  )
}
