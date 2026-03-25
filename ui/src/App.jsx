import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const initialPath = window.location.pathname.replace(/^\/+|\/+$/g, '')
const isDashboardPath = initialPath === 'dashboard'

function PublicView({ initialSlug = '' }) {
  const [slug, setSlug] = useState(initialSlug)
  const [page, setPage] = useState(null)
  const [photos, setPhotos] = useState([])
  const [texts, setTexts] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [messageText, setMessageText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (!slug) {
      setPage(null)
      setPhotos([])
      setTexts([])
      setMessages([])
      return
    }

    const fetchPage = async () => {
      setLoading(true)
      setError('')
      try {
        const pageRes = await fetch(`${API_BASE}/api/pages/${slug}`)
        if (!pageRes.ok) {
          setError(pageRes.status === 404 ? 'Bu slug icin sayfa bulunamadi.' : 'Sayfa yuklenirken bir hata olustu.')
          setPage(null)
          setPhotos([])
          setTexts([])
          setMessages([])
          return
        }

        const [pageData, photosRes, textsRes, messagesRes] = await Promise.all([
          pageRes.json(),
          fetch(`${API_BASE}/api/pages/${slug}/photos`),
          fetch(`${API_BASE}/api/pages/${slug}/texts`),
          fetch(`${API_BASE}/api/pages/${slug}/messages`),
        ])

        if (!photosRes.ok || !textsRes.ok || !messagesRes.ok) throw new Error('related endpoints failed')

        const photosData = await photosRes.json()
        const textsData = await textsRes.json()
        const messagesData = await messagesRes.json()

        setPage(pageData)
        setPhotos(photosData.items || [])
        setTexts(textsData.items || [])
        setMessages(messagesData.items || [])
      } catch {
        setError('Sunucuya baglanirken bir hata olustu.')
        setPage(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [slug])

  const onSubmitMessage = async (e) => {
    e.preventDefault()
    if (!slug) return

    const name = authorName.trim()
    const email = authorEmail.trim()
    const text = messageText.trim()

    if (!name || !text) {
      setError('Lutfen isim ve mesaj gir.')
      return
    }

    try {
      setPosting(true)
      setError('')
      const res = await fetch(`${API_BASE}/api/pages/${slug}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: name,
          authorEmail: email || null,
          messageText: text,
        }),
      })
      if (!res.ok) throw new Error('post message failed')

      const listRes = await fetch(`${API_BASE}/api/pages/${slug}/messages`)
      const listData = await listRes.json()
      setMessages(listData.items || [])
      setMessageText('')
    } catch {
      setError('Mesaj gonderilemedi.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <section className="card">
      <h2>Public Page Preview</h2>
      <p className="hint">Dashboard: <code>http://localhost:5173/dashboard</code></p>

      <div className="field-group">
        <label htmlFor="slug">Slug</label>
        <input id="slug" type="text" placeholder="john-and-martha" value={slug} onChange={(e) => setSlug(e.target.value.trim())} />
      </div>

      {loading && <p>Yukleniyor...</p>}
      {error && <p className="error">{error}</p>}

      {page && (
        <div className="preview">
          <h3>{page.title}</h3>
          <p className="template">Template: {page.templateName} ({page.templateCode})</p>
          {page.mainText && <p>{page.mainText}</p>}

          <hr />
          <h4>Text Blocks</h4>
          {texts.length === 0 ? <p>Text yok.</p> : texts.map((t) => <p key={t.id}><strong>{t.blockKey}:</strong> {t.content}</p>)}

          <hr />
          <h4>Photos</h4>
          {photos.length === 0 ? <p>Fotograf yok.</p> : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {photos.map((p) => (
                <img key={p.id} src={p.thumbnailUrl || p.fileUrl} alt={p.caption || 'photo'} style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 8 }} />
              ))}
            </div>
          )}

          <hr />
          <h4>Mesaj Birak</h4>
          <form onSubmit={onSubmitMessage} style={{ maxWidth: 520, margin: '0 auto', textAlign: 'left', display: 'grid', gap: 10 }}>
            <input type="text" placeholder="Isim" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
            <input type="email" placeholder="E-posta (opsiyonel)" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} />
            <textarea placeholder="Mesaj" value={messageText} onChange={(e) => setMessageText(e.target.value)} style={{ minHeight: 100 }} />
            <button type="submit" disabled={posting}>{posting ? 'Gonderiliyor...' : 'Gonder'}</button>
          </form>
        </div>
      )}
    </section>
  )
}

function DashboardView() {
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

  const [photoLines, setPhotoLines] = useState('')
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
      setPhotoLines('')
      setTextLines('')
      setThemeColor('')
      setMusicUrl('')
      return
    }
    const data = await res.json()
    setPhotoLines((data.photos || []).map((p) => p.fileUrl).join('\n'))
    setTextLines((data.texts || []).map((t) => t.content).join('\n'))
    setThemeColor(data.page?.settings?.themeColor || '')
    setMusicUrl(data.page?.settings?.musicUrl || '')
  }

  useEffect(() => {
    loadTemplates().catch(() => setDashError('Template listesi alinamadi'))
    loadPages().catch(() => setDashError('Page listesi alinamadi'))
  }, [])

  useEffect(() => {
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

    const photoItems = photoLines
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean)
      .map((fileUrl, i) => ({ fileUrl, sortOrder: i + 1 }))

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
          photos: photoItems,
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
      setDashInfo('Icerik kaydedildi.')
    } catch {
      setDashError('Icerik kaydedilemedi.')
    }
  }

  const ruleInfo = selectedTemplate?.configSchema?.contentRules || {}

  return (
    <section className="card">
      <h2>Dashboard</h2>
      <p className="hint">Public preview icin slug yoluna git: <code>/john-and-martha</code></p>
      {dashError && <p className="error">{dashError}</p>}
      {dashInfo && <p>{dashInfo}</p>}

      <hr />
      <h3>Template Create</h3>
      <form onSubmit={createTemplate} style={{ display: 'grid', gap: 8, textAlign: 'left' }}>
        <input placeholder="template code (anniversary-basic)" value={newTemplateCode} onChange={(e) => setNewTemplateCode(e.target.value)} />
        <input placeholder="template name" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} />
        <input placeholder="category" value={newTemplateCategory} onChange={(e) => setNewTemplateCategory(e.target.value)} />
        <input type="number" min="0" placeholder="max photos" value={maxPhotos} onChange={(e) => setMaxPhotos(Number(e.target.value))} />
        <input type="number" min="0" placeholder="max texts" value={maxTexts} onChange={(e) => setMaxTexts(Number(e.target.value))} />
        <button type="submit">Create Template</button>
      </form>

      <hr />
      <h3>Page Create</h3>
      <form onSubmit={createPage} style={{ display: 'grid', gap: 8, textAlign: 'left' }}>
        <input placeholder="ownerUserId" value={ownerUserId} onChange={(e) => setOwnerUserId(e.target.value)} />
        <button type="button" onClick={() => loadPages().catch(() => setDashError('Page listesi yenilenemedi'))}>Load Owner Pages</button>
        <input placeholder="slug (ayse-anniversary-2026)" value={newPageSlug} onChange={(e) => setNewPageSlug(e.target.value)} />
        <input placeholder="title" value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} />
        <select value={newPageTemplateId} onChange={(e) => setNewPageTemplateId(e.target.value)}>
          <option value="">Template sec</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
          ))}
        </select>
        <button type="submit">Create Page</button>
      </form>

      <hr />
      <h3>Page Content Editor</h3>
      <div style={{ display: 'grid', gap: 8, textAlign: 'left' }}>
        <select value={selectedPageId} onChange={(e) => setSelectedPageId(e.target.value)}>
          <option value="">Page sec</option>
          {pages.map((p) => (
            <option key={p.id} value={p.id}>{p.slug} - {p.title}</option>
          ))}
        </select>

        {selectedTemplate && (
          <p>
            Template limits {'->'} maxPhotos: <strong>{ruleInfo.maxPhotos ?? '-'}</strong>, maxTexts:{' '}
            <strong>{ruleInfo.maxTexts ?? '-'}</strong>
          </p>
        )}

        <form onSubmit={saveContent} style={{ display: 'grid', gap: 8 }}>
          <label>
            Photos (her satir 1 url)
            <textarea value={photoLines} onChange={(e) => setPhotoLines(e.target.value)} style={{ minHeight: 130 }} />
          </label>
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
          <button type="submit" disabled={!selectedPageId}>Save Page Content</button>
        </form>
      </div>
    </section>
  )
}

function App({ initialSlug = '' }) {
  return (
    <div className="app">
      <header className="topbar">
        <h1>Special Days</h1>
        <p>Template sec, page olustur, icerik gir, slug ile yayinla</p>
      </header>
      <main>{isDashboardPath ? <DashboardView /> : <PublicView initialSlug={initialSlug} />}</main>
    </div>
  )
}

export default App
