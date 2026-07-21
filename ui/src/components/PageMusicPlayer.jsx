import { useEffect, useMemo, useRef } from 'react'
import { parseMusicSource } from '../lib/musicUrl.js'

/**
 * @param {{
 *   url: string,
 *   className?: string,
 *   title?: string,
 *   variant?: 'inline' | 'section',
 *   autoPlay?: boolean,
 * }} props
 */
export function PageMusicPlayer({
  url,
  className = '',
  title = 'Sayfa müziği',
  variant = 'section',
  autoPlay = false,
}) {
  const source = useMemo(() => parseMusicSource(url), [url])
  const audioRef = useRef(/** @type {HTMLAudioElement | null} */ (null))
  const shouldAutoPlay = Boolean(autoPlay && source?.type === 'audio')

  useEffect(() => {
    if (!shouldAutoPlay) return undefined
    const el = audioRef.current
    if (!el) return undefined

    let unlocked = false

    const tryPlay = () => {
      const p = el.play()
      if (p && typeof p.then === 'function') {
        p.then(() => {
          unlocked = true
        }).catch(() => {
          /* tarayıcı engelledi — ilk etkileşimde tekrar dene */
        })
      }
    }

    tryPlay()

    const unlock = () => {
      if (unlocked && !el.paused) return
      tryPlay()
    }

    document.addEventListener('pointerdown', unlock, { passive: true })
    document.addEventListener('keydown', unlock)
    document.addEventListener('touchstart', unlock, { passive: true })

    return () => {
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('keydown', unlock)
      document.removeEventListener('touchstart', unlock)
    }
  }, [shouldAutoPlay, source])

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
      ref={audioRef}
      src={source.src}
      controls
      autoPlay={shouldAutoPlay}
      preload={shouldAutoPlay ? 'auto' : 'metadata'}
      className={`page-music-player page-music-player--audio page-music-player--${variant} ${className}`.trim()}
    />
  )
}
