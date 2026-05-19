import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { API_BASE } from '../lib/api.js'
import './flowPages.css'

const LAYOUT_LABEL = {
  'split-hero': 'Yan yana galeri',
  stacked: 'Üst üste kartlar',
  minimal: 'Sade düzen',
  magazine: 'Dergi + yan sütun',
  timeline: 'Zaman çizelgesi',
  'split-scroll': 'Bölünmüş anılar',
  letter: 'Mektup',
  party: 'Parti / neon',
  scrapbook: 'Anı defteri',
  journey: 'Yolculuk hikâyesi',
  beauty: 'Beauty (TemplateMo)',
}

const VISUAL_HINT = {
  'wedding-gold': 'Premium düğün',
  'party-neon': 'Neon parti',
  scrapbook: 'Anı defteri stili',
  'romantic-burgundy': 'Romantik bordo',
  'letter-parchment': 'Mektup kağıdı',
}

function layoutHint(tpl) {
  const layout = tpl?.configSchema?.layout
  const base = (typeof layout === 'string' && LAYOUT_LABEL[layout]) || layout || 'Özel'
  const vt = tpl?.configSchema?.visualTheme
  const hint = typeof vt === 'string' ? VISUAL_HINT[vt] : ''
  return hint ? `${base} · ${hint}` : base
}

const PREVIEW_BY_LAYOUT = {
  minimal: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80',
  stacked: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=80',
  magazine: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
  timeline: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80',
  'split-scroll': 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&q=80',
  letter: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80',
  party: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80',
  scrapbook: 'https://images.unsplash.com/photo-1504196601072-998a40704068?w=600&q=80',
  journey: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80',
  beauty: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
}

function previewSrc(tpl) {
  if (tpl.previewImageUrl) return tpl.previewImageUrl
  const layout = tpl?.configSchema?.layout
  if (typeof layout === 'string' && PREVIEW_BY_LAYOUT[layout]) return PREVIEW_BY_LAYOUT[layout]
  return 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80'
}

function formatLimits(tpl) {
  const r = tpl?.configSchema?.contentRules
  const p = r?.maxPhotos
  const t = r?.maxTexts
  const parts = []
  if (typeof p === 'number') parts.push(`en fazla ${p} foto`)
  if (typeof t === 'number') parts.push(`en fazla ${t} metin`)
  return parts.length ? parts.join(' · ') : ''
}

export function TemplatePicker() {
  const { categoryCode } = useParams()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!categoryCode) return
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE}/api/categories/${encodeURIComponent(categoryCode)}/templates`)
        if (res.status === 404) {
          if (!cancelled) {
            setError('Bu kategori bulunamadı.')
            setItems([])
          }
          return
        }
        if (!res.ok) throw new Error('fail')
        const data = await res.json()
        if (!cancelled) setItems(data.items || [])
      } catch {
        if (!cancelled) setError('Şablonlar yüklenemedi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [categoryCode])

  const onSelect = (tpl) => {
    navigate('/create', { state: { template: tpl, categoryCode } })
  }

  return (
    <section className="flow-section">
      <h1>Şablon seçin</h1>
      <p className="flow-lead">
        Kategori: <strong>{categoryCode}</strong> — yerleşim ve içerik limitleri şablona göre değişir.
      </p>

      {error && <p className="error-banner">{error}</p>}
      {loading && <p>Yükleniyor...</p>}

      {!loading && !error && items.length === 0 && <p>Bu kategoride henüz şablon yok.</p>}

      <div className="template-grid">
        {items.map((tpl) => (
          <article key={tpl.id} className="template-card">
            <img className="template-card-preview" src={previewSrc(tpl)} alt="" />
            <div className="template-card-body">
              <h2>{tpl.name}</h2>
              <p>
                {layoutHint(tpl)} · {tpl.code}
              </p>
              {formatLimits(tpl) && <p className="template-card-limits">{formatLimits(tpl)}</p>}
              <button type="button" className="btn btn-primary btn-select" onClick={() => onSelect(tpl)}>
                Seç
              </button>
            </div>
          </article>
        ))}
      </div>

      <p style={{ marginTop: '2rem' }}>
        <Link to="/templates">← Kategori seçimine dön</Link>
      </p>
    </section>
  )
}
