import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../lib/api.js'
import { photoSrc } from '../lib/photoUrl.js'
import './flowPages.css'

function dashFileKey(f) {
  return `${f.name}-${f.size}-${f.lastModified}`
}

/** Sunucudaki fotograf sayisi + kuyruk sabi maxPhotos’u asmamali */
function mergeDashPhotoQueue(prev, incoming, maxPhotos, existingOnServer) {
  const cap = typeof maxPhotos === 'number' && maxPhotos > 0 ? maxPhotos : 999
  const canQueue = Math.max(0, cap - existingOnServer)
  if (canQueue <= 0) return prev
  const seen = new Set(prev.map(dashFileKey))
  const out = [...prev]
  for (const f of incoming) {
    if (out.length >= canQueue) break
    const k = dashFileKey(f)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(f)
  }
  return out
}

export function DashboardPage() {
  const [ownerUserId, setOwnerUserId] = useState('dbe9a6fa-1d4f-4c95-a094-b479c3027f83')
  const [templates, setTemplates] = useState([])
  const [pages, setPages] = useState([])
  const [selectedPageId, setSelectedPageId] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [dashError, setDashError] = useState('')
  const [dashInfo, setDashInfo] = useState('')

  const [newTemplateCode, setNewTemplateCode] = useState('')
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateCategory, setNewTemplateCategory] = useState('anniversary')
  const [maxPhotos, setMaxPhotos] = useState(10)
  const [maxTexts, setMaxTexts] = useState(3)

  const [newPageSlug, setNewPageSlug] = useState('')
  const [newPageTitle, setNewPageTitle] = useState('')
  const [newPageTemplateId, setNewPageTemplateId] = useState('')

  const [contentPhotos, setContentPhotos] = useState([])
  const [photoPending, setPhotoPending] = useState([])
  const [textLines, setTextLines] = useState('')
  const [themeColor, setThemeColor] = useState('')
  const [musicUrl, setMusicUrl] = useState('')

  const selectedPage = useMemo(() => pages.find((p) => p.id === selectedPageId) || null, [pages, selectedPageId])

  const loadTemplates = async () => {
    const res = await fetch(`${API_BASE}/api/dashboard/templates`)
    const data = await res.json()
    setTemplates(data.items || [])
  }

  const loadPages = async () => {
    if (!ownerUserId) return
    const res = await fetch(`${API_BASE}/api/dashboard/pages?ownerUserId=${encodeURIComponent(ownerUserId)}`)
    const data = await res.json()
    setPages(data.items || [])
  }

  const loadTemplateDetail = async (templateId) => {
    const res = await fetch(`${API_BASE}/api/dashboard/templates/${templateId}`)
    if (!res.ok) return setSelectedTemplate(null)
    const data = await res.json()
    setSelectedTemplate(data)
  }

  const loadPageContent = async (pageId) => {
    const res = await fetch(`${API_BASE}/api/dashboard/pages/${pageId}/content`)
    if (!res.ok) {
      setContentPhotos([])
      setTextLines('')
      setThemeColor('')
      setMusicUrl('')
      return
    }
    const data = await res.json()
    setContentPhotos(data.photos || [])
    setTextLines((data.texts || []).map((t) => t.content).join('\n'))
    setThemeColor(data.page?.settings?.themeColor || '')
    setMusicUrl(data.page?.settings?.musicUrl || '')
  }

  useEffect(() => {
    loadTemplates().catch(() => setDashError('Template listesi alinamadi'))
    loadPages().catch(() => setDashError('Page listesi alinamadi'))
  }, [])

  useEffect(() => {
    setPhotoPending([])
    if (selectedPage?.templateId) {
      loadTemplateDetail(selectedPage.templateId).catch(() => setDashError('Template detayi alinamadi'))
      loadPageContent(selectedPage.id).catch(() => setDashError('Page content alinamadi'))
    }
  }, [selectedPageId])

  const createTemplate = async (e) => {
    e.preventDefault()
    setDashError('')
    setDashInfo('')
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newTemplateCode.trim(),
          name: newTemplateName.trim(),
          category: newTemplateCategory.trim(),
          configSchema: {
            contentRules: { maxPhotos: Number(maxPhotos), maxTexts: Number(maxTexts) },
            optionalSettings: { themeColor: true, musicUrl: true },
          },
          isActive: true,
        }),
      })
      if (!res.ok) throw new Error('template create failed')
      await loadTemplates()
      setDashInfo('Template olusturuldu.')
      setNewTemplateCode('')
      setNewTemplateName('')
    } catch {
      setDashError('Template olusturulamadi.')
    }
  }

  const createPage = async (e) => {
    e.preventDefault()
    setDashError('')
    setDashInfo('')
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerUserId: ownerUserId.trim(),
          slug: newPageSlug.trim(),
          templateId: newPageTemplateId,
          title: newPageTitle.trim(),
          status: 'draft',
          isPublic: true,
        }),
      })
      if (!res.ok) throw new Error('page create failed')
      const data = await res.json()
      await loadPages()
      setSelectedPageId(data.id)
      setDashInfo('Page olusturuldu. Simdi icerik ekleyebilirsin.')
    } catch {
      setDashError('Page olusturulamadi.')
    }
  }

  const saveContent = async (e) => {
    e.preventDefault()
    if (!selectedPageId) return
    setDashError('')
    setDashInfo('')

    const textItems = textLines
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean)
      .map((content, i) => ({ blockKey: `text-${i + 1}`, content, sortOrder: i + 1 }))

    try {
      const res = await fetch(`${API_BASE}/api/dashboard/pages/${selectedPageId}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: textItems,
          themeColor: themeColor || null,
          musicUrl: musicUrl || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setDashError(data?.error || 'Icerik kaydedilemedi.')
        return
      }
      setDashInfo('Metinler ve tema kaydedildi. Fotograflar ayri yuklenir.')
    } catch {
      setDashError('Icerik kaydedilemedi.')
    }
  }

  const onQueueDashboardPhotos = (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!selectedPageId || files.length === 0) return
    const maxP = selectedTemplate?.configSchema?.contentRules?.maxPhotos
    setPhotoPending((prev) => mergeDashPhotoQueue(prev, files, maxP, contentPhotos.length))
  }

  const uploadQueuedDashboardPhotos = async () => {
    if (!selectedPageId || photoPending.length === 0) return
    setDashError('')
    setDashInfo('')
    try {
      for (let i = 0; i < photoPending.length; i++) {
        const file = photoPending[i]
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(`${API_BASE}/api/dashboard/pages/${selectedPageId}/photos`, {
          method: 'POST',
          body: fd,
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          setDashError(err?.error || 'Fotograf yuklenemedi.')
          setPhotoPending(photoPending.slice(i))
          await loadPageContent(selectedPageId)
          return
        }
      }
      setPhotoPending([])
      await loadPageContent(selectedPageId)
      setDashInfo('Fotograflar yuklendi.')
    } catch {
      setDashError('Fotograf yuklenemedi.')
    }
  }

  const onDeleteDashboardPhoto = async (photoId) => {
    if (!selectedPageId || !photoId) return
    setDashError('')
    setDashInfo('')
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/pages/${selectedPageId}/photos/${photoId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setDashError(err?.error || 'Silinemedi.')
        return
      }
      await loadPageContent(selectedPageId)
      setDashInfo('Fotograf silindi.')
    } catch {
      setDashError('Silinemedi.')
    }
  }

  const ruleInfo = selectedTemplate?.configSchema?.contentRules || {}

  return (
    <section className="flow-section" style={{ textAlign: 'left', maxWidth: 720 }}>
      <h1 style={{ textAlign: 'center' }}>Pano</h1>
      <p className="flow-lead" style={{ textAlign: 'center' }}>
        Geliştirici araçları. Yayınlanan sayfa: <Link to="/john-and-martha">/john-and-martha</Link> veya{' '}
        <Link to="/templates">yeni akış</Link>.
      </p>
      {dashError && <p className="error-banner">{dashError}</p>}
      {dashInfo && <p className="info-banner">{dashInfo}</p>}

      <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid #ece8f0' }} />
      <h2>Template Create</h2>
      <form onSubmit={createTemplate} className="create-form" style={{ maxWidth: 'none', marginBottom: '1.5rem' }}>
        <input placeholder="template code (anniversary-basic)" value={newTemplateCode} onChange={(e) => setNewTemplateCode(e.target.value)} />
        <input placeholder="template name" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} />
        <input placeholder="category" value={newTemplateCategory} onChange={(e) => setNewTemplateCategory(e.target.value)} />
        <input type="number" min="0" placeholder="max photos" value={maxPhotos} onChange={(e) => setMaxPhotos(Number(e.target.value))} />
        <input type="number" min="0" placeholder="max texts" value={maxTexts} onChange={(e) => setMaxTexts(Number(e.target.value))} />
        <button type="submit" className="btn btn-primary">
          Create Template
        </button>
      </form>

      <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid #ece8f0' }} />
      <h2>Page Create</h2>
      <form onSubmit={createPage} className="create-form" style={{ maxWidth: 'none', marginBottom: '1.5rem' }}>
        <input placeholder="ownerUserId" value={ownerUserId} onChange={(e) => setOwnerUserId(e.target.value)} />
        <button type="button" className="btn btn-primary" onClick={() => loadPages().catch(() => setDashError('Page listesi yenilenemedi'))}>
          Load Owner Pages
        </button>
        <input placeholder="slug (ayse-anniversary-2026)" value={newPageSlug} onChange={(e) => setNewPageSlug(e.target.value)} />
        <input placeholder="title" value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} />
        <select value={newPageTemplateId} onChange={(e) => setNewPageTemplateId(e.target.value)}>
          <option value="">Template sec</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.code})
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Create Page
        </button>
      </form>

      <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid #ece8f0' }} />
      <h2>Page Content Editor</h2>
      <div className="create-form" style={{ maxWidth: 'none' }}>
        <select value={selectedPageId} onChange={(e) => setSelectedPageId(e.target.value)}>
          <option value="">Page sec</option>
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.slug} - {p.title}
            </option>
          ))}
        </select>

        {selectedTemplate && (
          <p>
            Template limits {'->'} maxPhotos: <strong>{ruleInfo.maxPhotos ?? '-'}</strong>, maxTexts:{' '}
            <strong>{ruleInfo.maxTexts ?? '-'}</strong>
          </p>
        )}

        <div style={{ marginBottom: 12 }}>
          <strong>Fotograflar</strong>
          <p className="form-hint" style={{ margin: '6px 0 8px' }}>
            Dosya sec; birden fazla seferde ekleyebilirsiniz. Yuklemeden once kuyrugu kontrol edin.
          </p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={!selectedPageId}
            onChange={onQueueDashboardPhotos}
          />
          {photoPending.length > 0 && (
            <>
              <ul className="photo-pick-list" style={{ marginTop: 8 }}>
                {photoPending.map((f, i) => (
                  <li key={`${dashFileKey(f)}-${i}`}>
                    <span>{f.name}</span>
                    <button
                      type="button"
                      className="btn btn-text-remove"
                      onClick={() => setPhotoPending((prev) => prev.filter((_, j) => j !== i))}
                    >
                      Kaldır
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: 8 }}
                onClick={() => uploadQueuedDashboardPhotos()}
              >
                {photoPending.length} dosyayı yükle
              </button>
            </>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            {contentPhotos.map((p) => (
              <div key={p.id} style={{ position: 'relative', width: 100 }}>
                <img
                  src={photoSrc(p.thumbnailUrl || p.fileUrl)}
                  alt=""
                  style={{ width: 100, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #ece8f0' }}
                />
                <button
                  type="button"
                  className="btn"
                  style={{ marginTop: 6, fontSize: 12, padding: '4px 8px', width: '100%' }}
                  onClick={() => onDeleteDashboardPhoto(p.id)}
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={saveContent} style={{ display: 'grid', gap: 8 }}>
          <label>
            Texts (her satir 1 metin)
            <textarea value={textLines} onChange={(e) => setTextLines(e.target.value)} style={{ minHeight: 130 }} />
          </label>
          <label>
            Theme Color (optional)
            <input value={themeColor} onChange={(e) => setThemeColor(e.target.value)} placeholder="#ff6699" />
          </label>
          <label>
            Music Url (optional)
            <input value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)} placeholder="https://..." />
          </label>
          <button type="submit" className="btn btn-primary" disabled={!selectedPageId}>
            Save Page Content
          </button>
        </form>
      </div>
    </section>
  )
}
