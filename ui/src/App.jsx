import { useEffect, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function App({ initialSlug = '' }) {
  const [slug, setSlug] = useState(initialSlug)
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) {
      setPage(null)
      return
    }

    const fetchPage = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE}/api/pages/${slug}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Bu slug için sayfa bulunamadı.')
          } else {
            setError('Sayfa yüklenirken bir hata oluştu.')
          }
          setPage(null)
          return
        }
        const data = await res.json()
        setPage(data)
      } catch (e) {
        setError('Sunucuya bağlanırken bir hata oluştu.')
        setPage(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [slug])

  return (
    <div className="app">
      <header className="topbar">
        <h1>Special Days</h1>
        <p>Özel günler için kişisel sayfalar</p>
      </header>

      <main>
        <section className="card">
          <h2>Sayfa Önizleme</h2>

          <div className="field-group">
            <label htmlFor="slug">Slug (örn: john-and-martha)</label>
            <input
              id="slug"
              type="text"
              placeholder="john-and-martha"
              value={slug}
              onChange={(e) => setSlug(e.target.value.trim())}
            />
            <p className="hint">
              URL: <code>http://localhost:5173/{slug || '<slug>'}</code>
            </p>
          </div>

          {loading && <p>Yükleniyor...</p>}
          {error && <p className="error">{error}</p>}

          {page && (
            <div className="preview">
              <h3>{page.title}</h3>
              {page.eventDate && (
                <p className="date">
                  Etkinlik tarihi: {new Date(page.eventDate).toLocaleDateString('tr-TR')}
                </p>
              )}
              <p>{page.mainText}</p>
              <p className="template">Şablon: {page.templateId}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
