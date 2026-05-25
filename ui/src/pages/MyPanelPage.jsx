import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api.js'
import { getPreviewPageUrl, getPublicPageUrl } from '../lib/pageUrl.js'
import { useAuth } from '../context/AuthContext.jsx'
import './flowPages.css'
import './myPanel.css'

const STATUS_LABEL = {
  draft: 'Taslak',
  published: 'Yayında',
  archived: 'Arşiv',
}

function pageStatusKey(page) {
  if (page.deletedAt) return 'deleted'
  return page.status || 'draft'
}

function pageStatusLabel(page) {
  if (page.deletedAt) return 'Silindi'
  return STATUS_LABEL[page.status] || page.status
}

export function MyPanelPage() {
  const { user, isAdmin } = useAuth()
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState('')

  const loadPages = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const listUrl = isAdmin ? '/api/dashboard/pages' : '/api/me/pages'
      const res = await apiFetch(listUrl)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Sayfalar yüklenemedi')
        setPages([])
        return
      }
      setPages(data.items || [])
    } catch {
      setError('Sunucuya bağlanılamadı')
      setPages([])
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    loadPages()
  }, [loadPages])

  const onDelete = async (page) => {
    if (!window.confirm(`"${page.title}" sayfasını silmek istediğinize emin misiniz?`)) return
    setDeletingId(page.id)
    setError('')
    try {
      const res = await apiFetch(`/api/me/pages/${page.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Silinemedi')
        return
      }
      if (isAdmin) {
        setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, ...data, deletedAt: data.deletedAt || new Date().toISOString() } : p)))
      } else {
        setPages((prev) => prev.filter((p) => p.id !== page.id))
      }
    } catch {
      setError('Sunucuya bağlanılamadı')
    } finally {
      setDeletingId('')
    }
  }

  const visiblePages = isAdmin ? pages : pages.filter((p) => !p.deletedAt)

  return (
    <div className="my-panel">
      <header className="my-panel-head">
        <div>
          <h1>Panom</h1>
          <p className="my-panel-greeting">
            Merhaba{user?.fullName ? `, ${user.fullName}` : ''} —{' '}
            {isAdmin ? 'yönetici olarak tüm sayfalar listelenir.' : 'özel gün sayfalarınız burada.'}
          </p>
        </div>
        <Link to="/templates" className="btn btn-primary">
          Yeni sayfa oluştur
        </Link>
      </header>

      {error ? <p className="published-error">{error}</p> : null}

      {loading ? (
        <p className="my-panel-muted">Yükleniyor…</p>
      ) : visiblePages.length === 0 ? (
        <div className="my-panel-empty">
          <p>Henüz sayfanız yok.</p>
          <Link to="/templates" className="btn btn-primary">
            İlk sayfanızı oluşturun
          </Link>
        </div>
      ) : (
        <ul className="my-panel-list">
          {visiblePages.map((page) => {
            const isDeleted = Boolean(page.deletedAt)
            const isDraft = !isDeleted && page.status === 'draft'
            const statusKey = pageStatusKey(page)
            const publicUrl = getPublicPageUrl(page.slug)
            const previewUrl =
              isDraft && page.previewToken ? getPreviewPageUrl(page.slug, page.previewToken) : null
            const pendingCount = page.pendingMessageCount ?? 0

            return (
              <li key={page.id} className={`my-panel-card${isDeleted ? ' my-panel-card--deleted' : ''}`}>
                <div className="my-panel-card-main">
                  <h2>{page.title}</h2>
                  <p className="my-panel-card-meta">
                    <span className={`my-panel-status my-panel-status--${statusKey}`}>
                      {pageStatusLabel(page)}
                    </span>
                    <span className="my-panel-slug">/{page.slug}</span>
                    {isAdmin && page.ownerUserId ? (
                      <span className="my-panel-owner" title="Sayfa sahibi">
                        {page.ownerUserId === user?.id
                          ? 'Sizin sayfanız'
                          : page.ownerLabel || page.ownerFullName || page.ownerEmail || 'Bilinmeyen kullanıcı'}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="my-panel-card-actions">
                  {!isDeleted ? (
                    <>
                      <Link to={`/edit/${page.slug}`} className="btn">
                        Düzenle
                      </Link>
                      <Link to={`/panom/${page.slug}/defter`} className="btn btn-guestbook">
                        Misafir defteri
                        {pendingCount > 0 ? (
                          <span className="my-panel-badge">{pendingCount}</span>
                        ) : null}
                      </Link>
                      {isDraft && previewUrl ? (
                        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn">
                          Önizle
                        </a>
                      ) : null}
                      {page.status === 'published' ? (
                        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn">
                          Sayfayı aç
                        </a>
                      ) : null}
                      <button
                        type="button"
                        className="btn btn-danger-outline"
                        disabled={deletingId === page.id}
                        onClick={() => onDelete(page)}
                      >
                        {deletingId === page.id ? 'Siliniyor…' : 'Sil'}
                      </button>
                    </>
                  ) : (
                    <span className="my-panel-deleted-hint">Bu kayıt yalnızca yöneticiye görünür.</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
