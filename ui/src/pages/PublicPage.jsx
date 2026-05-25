import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { API_BASE } from '../lib/api.js'
import { PublishedPageView } from './published/PublishedPageView.jsx'
import './PublicPage.css'

export function PublicPage() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [photos, setPhotos] = useState([])
  const [texts, setTexts] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!slug) {
      setPage(null)
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setLoadError('')
      try {
        const pageRes = await fetch(`${API_BASE}/api/pages/${slug}`)
        if (!pageRes.ok) {
          if (!cancelled) {
            setLoadError(pageRes.status === 404 ? 'Bu adreste sayfa yok.' : 'Sayfa yüklenemedi.')
            setPage(null)
            setPhotos([])
            setTexts([])
          }
          return
        }

        const [pageData, photosRes, textsRes, messagesRes] = await Promise.all([
          pageRes.json(),
          fetch(`${API_BASE}/api/pages/${slug}/photos`),
          fetch(`${API_BASE}/api/pages/${slug}/texts`),
          fetch(`${API_BASE}/api/pages/${slug}/messages`),
        ])

        if (!photosRes.ok || !textsRes.ok) throw new Error('related')

        const photosData = await photosRes.json()
        const textsData = await textsRes.json()
        const messagesData = messagesRes.ok ? await messagesRes.json() : { items: [] }

        if (!cancelled) {
          setPage(pageData)
          setPhotos(photosData.items || [])
          setTexts(textsData.items || [])
          setMessages(messagesData.items || [])
        }
      } catch {
        if (!cancelled) {
          setLoadError('Sunucuya bağlanılamadı.')
          setPage(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [slug])

  const textsSorted = useMemo(
    () => [...texts].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [texts]
  )

  if (!slug) {
    return <div className="published-missing">Geçersiz adres.</div>
  }

  if (loading) {
    return <div className="published-loading">Yükleniyor...</div>
  }

  if (!page) {
    return (
      <div className="published-wrap">
        {loadError ? <p className="published-error">{loadError}</p> : null}
        {!loadError ? <p className="published-missing">Sayfa bulunamadı.</p> : null}
      </div>
    )
  }

  return (
    <PublishedPageView
      page={page}
      photos={photos}
      texts={textsSorted}
      messages={messages}
      slug={slug}
      previewMode={false}
      embedded={false}
    />
  )
}
