import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE, DEFAULT_OWNER_USER_ID } from '../lib/api.js'
import './flowPages.css'

function textBlockKeys(template) {
  const rules = template?.configSchema?.contentRules
  const max = typeof rules?.maxTexts === 'number' ? rules.maxTexts : 3
  if (template?.code === 'wedding-basic' && max >= 3) {
    return ['intro', 'story', 'footer'].slice(0, max)
  }
  return Array.from({ length: Math.max(0, max) }, (_, i) => `text-${i + 1}`)
}

const KEY_LABELS = {
  intro: 'Giriş metni',
  story: 'Hikaye',
  footer: 'Alt bilgi',
}

function fileDedupeKey(f) {
  return `${f.name}-${f.size}-${f.lastModified}`
}

/** Yeni secim onceki dosyalarin uzerine yazilmasin (ayri pencerelerde tek tek secim dahil) */
function mergePickedFiles(prev, incoming, cap) {
  const limit = Number.isFinite(cap) && cap > 0 ? cap : 99
  const seen = new Set(prev.map(fileDedupeKey))
  const out = [...prev]
  for (const f of incoming) {
    const k = fileDedupeKey(f)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(f)
    if (out.length >= limit) break
  }
  return out
}

export function CreatePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const templateFromState = location.state?.template

  const [template, setTemplate] = useState(templateFromState || null)
  const [loadError, setLoadError] = useState('')
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [mainText, setMainText] = useState('')
  const [photoFiles, setPhotoFiles] = useState([])
  const [textByKey, setTextByKey] = useState({})
  const [themeColor, setThemeColor] = useState('#c41e3a')
  const [musicUrl, setMusicUrl] = useState('')
  const [ownerUserId, setOwnerUserId] = useState(() => DEFAULT_OWNER_USER_ID)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formInfo, setFormInfo] = useState('')

  const templateIdParam = searchParams.get('templateId')

  useEffect(() => {
    if (templateFromState) {
      setTemplate(templateFromState)
      return
    }
    const id = templateIdParam
    if (!id) {
      setTemplate(null)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadError('')
      try {
        const res = await fetch(`${API_BASE}/api/templates/${id}`)
        if (!res.ok) throw new Error('not found')
        const data = await res.json()
        if (!cancelled) setTemplate(data)
      } catch {
        if (!cancelled) {
          setTemplate(null)
          setLoadError('Şablon bulunamadı.')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [templateFromState, templateIdParam])

  const keys = useMemo(() => (template ? textBlockKeys(template) : []), [template])

  useEffect(() => {
    if (!template || keys.length === 0) return
    setTextByKey((prev) => {
      const next = { ...prev }
      for (const k of keys) {
        if (next[k] === undefined) next[k] = ''
      }
      return next
    })
  }, [template, keys])

  const maxPhotos = template?.configSchema?.contentRules?.maxPhotos

  const onPublish = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormInfo('')
    if (!template) return

    const s = slug.trim().toLowerCase()
    const t = title.trim()
    if (!s || !t) {
      setFormError('Sayfa adresi (slug) ve başlık zorunludur.')
      return
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
      setFormError('Slug yalnızca küçük harf, rakam ve tire içerebilir.')
      return
    }

    if (typeof maxPhotos === 'number' && photoFiles.length > maxPhotos) {
      setFormError(`Bu şablonda en fazla ${maxPhotos} fotoğraf yükleyebilirsiniz.`)
      return
    }

    const texts = keys
      .map((blockKey, i) => ({
        blockKey,
        content: (textByKey[blockKey] || '').trim(),
        sortOrder: i + 1,
      }))
      .filter((x) => x.content)

    if (typeof template.configSchema?.contentRules?.maxTexts === 'number') {
      const maxT = template.configSchema.contentRules.maxTexts
      if (texts.length > maxT) {
        setFormError(`Bu şablonda en fazla ${maxT} metin bloğu kullanılabilir.`)
        return
      }
    }

    let eventIso = null
    if (eventDate) {
      const d = new Date(eventDate)
      if (!Number.isNaN(d.getTime())) eventIso = d.toISOString()
    }

    setSubmitting(true)
    try {
      const createRes = await fetch(`${API_BASE}/api/dashboard/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerUserId: ownerUserId.trim(),
          slug: s,
          templateId: template.id,
          title: t,
          eventDate: eventIso,
          mainText: mainText.trim() || null,
          status: 'published',
          isPublic: true,
          settings: {},
        }),
      })
      const createdBody = await createRes.json().catch(() => ({}))
      if (!createRes.ok) {
        setFormError(createdBody?.error || 'Sayfa oluşturulamadı.')
        return
      }
      const pageId = createdBody.id

      for (const file of photoFiles) {
        const fd = new FormData()
        fd.append('file', file)
        const up = await fetch(`${API_BASE}/api/dashboard/pages/${pageId}/photos`, {
          method: 'POST',
          body: fd,
        })
        if (!up.ok) {
          const errBody = await up.json().catch(() => ({}))
          setFormError(errBody?.error || 'Fotoğraf yüklenemedi.')
          return
        }
      }

      const contentRes = await fetch(`${API_BASE}/api/dashboard/pages/${pageId}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts,
          themeColor: themeColor.trim() || null,
          musicUrl: musicUrl.trim() || null,
        }),
      })
      const contentBody = await contentRes.json().catch(() => ({}))
      if (!contentRes.ok) {
        setFormError(contentBody?.error || 'İçerik kaydedilemedi.')
        return
      }

      setFormInfo('Sayfanız yayında.')
      navigate(`/${s}`, { replace: true })
    } catch {
      setFormError('Sunucuya bağlanılamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!template && loadError) {
    return (
      <section className="flow-section">
        <p className="error-banner">{loadError}</p>
        <p>
          <Link to="/templates">Şablon seç</Link>
        </p>
      </section>
    )
  }

  if (!template) {
    return (
      <section className="flow-section">
        <h1>Sayfa oluştur</h1>
        <p className="flow-lead">Önce bir şablon seçmelisiniz.</p>
        <Link to="/templates" className="btn btn-primary">
          Şablonlara git
        </Link>
      </section>
    )
  }

  return (
    <section className="flow-section">
      <h1>Sayfanızı oluşturun</h1>
      <p className="flow-lead">
        Şablon: <strong>{template.name}</strong> ({template.code})
      </p>

      {formError && <p className="error-banner">{formError}</p>}
      {formInfo && <p className="info-banner">{formInfo}</p>}

      <form className="create-form" onSubmit={onPublish}>
        <label>
          Sayfa adresi (slug)
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="john-ve-martha" />
          <span className="form-hint">Örn: site.com/john-ve-martha — yalnızca küçük harf, rakam, tire.</span>
        </label>
        <label>
          Sayfa başlığı
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="John & Martha Düğünü" />
        </label>
        <label>
          Etkinlik tarihi
          <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        </label>
        <label>
          Karşılama metni
          <textarea value={mainText} onChange={(e) => setMainText(e.target.value)} placeholder="Davet metniniz..." />
        </label>

        {keys.map((k) => (
          <label key={k}>
            {KEY_LABELS[k] || `Metin: ${k}`}
            <textarea
              value={textByKey[k] ?? ''}
              onChange={(e) => setTextByKey((prev) => ({ ...prev, [k]: e.target.value }))}
            />
          </label>
        ))}

        <label>
          Fotoğraflar
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => {
              const add = Array.from(e.target.files || [])
              e.target.value = ''
              if (add.length === 0) return
              setPhotoFiles((prev) => mergePickedFiles(prev, add, maxPhotos))
            }}
          />
          {typeof maxPhotos === 'number' && (
            <span className="form-hint">
              En fazla {maxPhotos} dosya (JPEG, PNG, WebP, GIF; dosya başına en fazla ~10 MB). İsterseniz birden
              çok kez dosya seçerek ekleyebilirsiniz.
            </span>
          )}
          {photoFiles.length > 0 && (
            <ul className="photo-pick-list">
              {photoFiles.map((f, i) => (
                <li key={`${fileDedupeKey(f)}-${i}`}>
                  <span>{f.name}</span>
                  <button
                    type="button"
                    className="btn btn-text-remove"
                    onClick={() => setPhotoFiles((prev) => prev.filter((_, j) => j !== i))}
                  >
                    Kaldır
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>

        <label>
          Tema rengi (isteğe bağlı)
          <input value={themeColor} onChange={(e) => setThemeColor(e.target.value)} placeholder="#c41e3a" />
        </label>
        <label>
          Müzik URL (isteğe bağlı)
          <input value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)} placeholder="https://..." />
        </label>

        <label>
          Sahip kullanıcı ID (geçici)
          <input value={ownerUserId} onChange={(e) => setOwnerUserId(e.target.value)} />
          <span className="form-hint">
            Giriş olmadan deneme için .env içinde VITE_DEFAULT_OWNER_USER_ID kullanın.
          </span>
        </label>

        <button type="submit" className="btn btn-publish btn-block" disabled={submitting}>
          {submitting ? 'Yayınlanıyor...' : 'Sayfayı yayınla'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem' }}>
        <Link to="/templates">Başka şablon</Link>
      </p>
    </section>
  )
}
