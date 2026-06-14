import { useEffect, useState } from 'react'
import { API_BASE } from '../lib/api.js'
import { getPublicPageUrl } from '../lib/pageUrl.js'

/**
 * @param {{ slug: string, page: { title?: string, mainText?: string | null } | null }} props
 */
export function usePageOgMeta({ slug, page }) {
  const [og, setOg] = useState(null)

  useEffect(() => {
    if (!slug || !page) {
      setOg(null)
      return undefined
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/og/${encodeURIComponent(slug)}`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setOg(data)
          return
        }
      } catch {
        /* fallback below */
      }

      if (!cancelled) {
        const title = page.title?.trim() || slug
        const desc = (page.mainText || '').trim().slice(0, 200) || `${title} — özel gün sayfası`
        setOg({
          title,
          description: desc,
          pageUrl: getPublicPageUrl(slug),
          imageUrl: '',
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [slug, page])

  return og
}
