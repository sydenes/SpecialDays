import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../lib/api.js'
import './flowPages.css'

export function CategorySelect() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE}/api/categories`)
        if (!res.ok) throw new Error('fail')
        const data = await res.json()
        if (!cancelled) setItems(data.items || [])
      } catch {
        if (!cancelled) setError('Kategoriler yüklenemedi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="flow-section">
      <h1>Etkinlik türü</h1>
      <p className="flow-lead">Önce kategorinizi seçin; ardından o kategoriye uygun şablonları göreceksiniz.</p>

      {error && <p className="error-banner">{error}</p>}
      {loading && <p>Yükleniyor...</p>}

      {!loading && !error && items.length === 0 && <p>Henüz kategori yok.</p>}

      <div className="category-grid">
        {items.map((c) => (
          <Link key={c.id} to={`/templates/${c.code}`} className="category-card">
            <span className="category-card-title">{c.name}</span>
            {c.description ? <span className="category-card-desc">{c.description}</span> : null}
            <span className="category-card-cta">Şablonları gör →</span>
          </Link>
        ))}
      </div>

      <p style={{ marginTop: '2rem' }}>
        <Link to="/">Ana sayfaya dön</Link>
      </p>
    </section>
  )
}
