import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE } from '../lib/api.js'
import './flowPages.css'

const CATEGORY_LABEL = {
  wedding: 'Düğün',
  birthday: 'Doğum günü',
  anniversary: 'Yıldönümü',
  baby: 'Bebek',
  other: 'Diğer',
}

function categoryLabel(cat) {
  return CATEGORY_LABEL[cat] || cat || 'Etkinlik'
}

function previewSrc(tpl) {
  if (tpl.previewImageUrl) return tpl.previewImageUrl
  return 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80'
}

export function TemplateSelect() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE}/api/templates`)
        if (!res.ok) throw new Error('list failed')
        const data = await res.json()
        if (!cancelled) setItems(data.items || [])
      } catch {
        if (!cancelled) setError('Şablonlar yüklenemedi. API çalışıyor mu?')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const onSelect = (tpl) => {
    navigate('/create', { state: { template: tpl } })
  }

  return (
    <section className="flow-section">
      <h1>Şablon seçin</h1>
      <p className="flow-lead">Özel sayfanız için bir tasarım seçin.</p>

      {error && <p className="error-banner">{error}</p>}
      {loading && <p>Yükleniyor...</p>}

      {!loading && !error && items.length === 0 && <p>Henüz aktif şablon yok.</p>}

      <div className="template-grid">
        {items.map((tpl) => (
          <article key={tpl.id} className="template-card">
            <img className="template-card-preview" src={previewSrc(tpl)} alt="" />
            <div className="template-card-body">
              <h2>{tpl.name}</h2>
              <p>
                {categoryLabel(tpl.category)} · {tpl.code}
              </p>
              <button type="button" className="btn btn-primary btn-select" onClick={() => onSelect(tpl)}>
                Seç
              </button>
            </div>
          </article>
        ))}
      </div>

      <p style={{ marginTop: '2rem' }}>
        <Link to="/">Ana sayfaya dön</Link>
      </p>
    </section>
  )
}
