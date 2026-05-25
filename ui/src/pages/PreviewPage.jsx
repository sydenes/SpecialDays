import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { PublishedPageView } from './published/PublishedPageView.jsx'
import { DraftPreviewBanner } from './preview/DraftPreviewBanner.jsx'
import './PublicPage.css'
import './preview/draftPreviewBanner.css'

export function PreviewPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const canPreview = Boolean(token.trim()) || Boolean(user)

  const [page, setPage] = useState(null)
  const [photos, setPhotos] = useState([])
  const [texts, setTexts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const query = useMemo(() => {
    const t = token.trim()
    return t ? `?token=${encodeURIComponent(t)}` : ''
  }, [token])

  useEffect(() => {
    if (!slug || !canPreview) {
      setLoading(false)
      setLoadError('Önizleme bağlantısı geçersiz veya giriş gerekli.')
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setLoadError('')
      try {
        const previewPath = `/api/preview/${encodeURIComponent(slug)}${query}`
        const pageRes = await apiFetch(previewPath)
        if (!pageRes.ok) {
          if (!cancelled) {
            setLoadError(pageRes.status === 404 ? 'Taslak bulunamadı veya bağlantı süresi dolmuş.' : 'Önizleme yüklenemedi.')
            setPage(null)
          }
          return
        }

        const [pageData, photosRes, textsRes] = await Promise.all([
          pageRes.json(),
          apiFetch(`/api/preview/${encodeURIComponent(slug)}/photos${query}`),
          apiFetch(`/api/preview/${encodeURIComponent(slug)}/texts${query}`),
        ])

        if (!photosRes.ok || !textsRes.ok) throw new Error('related')

        const photosData = await photosRes.json()
        const textsData = await textsRes.json()

        if (!cancelled) {
          setPage(pageData)
          setPhotos(photosData.items || [])
          setTexts(textsData.items || [])
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
  }, [slug, query, token, canPreview])

  const textsSorted = useMemo(
    () => [...texts].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [texts]
  )

  if (!slug || !canPreview) {
    return (
      <div className="published-wrap">
        <p className="published-error">Önizleme için geçerli bağlantı veya giriş gerekir.</p>
        <p>
          <Link to="/templates">Şablon seç</Link>
        </p>
      </div>
    )
  }

  if (loading) {
    return <div className="published-loading">Taslak önizleniyor…</div>
  }

  if (!page) {
    return (
      <div className="published-wrap">
        {loadError ? <p className="published-error">{loadError}</p> : null}
        <p>
          <Link to={`/edit/${slug}`}>Düzenlemeye dön</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="preview-page-root">
      <PublishedPageView
        page={page}
        photos={photos}
        texts={textsSorted}
        previewMode
        draftPreview
        embedded={false}
      />
      <DraftPreviewBanner slug={slug} />
    </div>
  )
}
