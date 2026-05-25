import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './SiteLayout.css'

const RESERVED_SINGLE = new Set([
  'templates',
  'create',
  'edit',
  'dashboard',
  'published',
  'preview',
  'panom',
  'giris',
  'kayit',
  'defter',
])

export function SiteLayout() {
  const { pathname } = useLocation()
  const { user, isAdmin, logout, loading } = useAuth()
  const seg = pathname.split('/').filter(Boolean)
  const isPublicEvent = seg.length === 1 && !RESERVED_SINGLE.has(seg[0])

  return (
    <div className={`site ${isPublicEvent ? 'site--public-event' : ''}`}>
      <header className="site-header">
        <Link to="/" className="site-logo">
          Special Days
        </Link>
        {isPublicEvent ? (
          <nav className="site-nav site-nav--minimal">
            <Link to="/">Ana sayfa</Link>
          </nav>
        ) : (
          <nav className="site-nav">
            <Link to="/">Ana Sayfa</Link>
            <Link to="/templates">Şablon Seç</Link>
            {user ? (
              <>
                <Link to="/panom">Panom</Link>
                {isAdmin ? <Link to="/dashboard">Yönetim</Link> : null}
                <button type="button" className="site-nav-btn" onClick={logout} disabled={loading}>
                  Çıkış
                </button>
              </>
            ) : (
              <>
                <span className="site-nav-placeholder">Blog</span>
                <Link to="/giris">Giriş</Link>
                <Link to="/kayit" className="site-nav-cta">
                  Kayıt ol
                </Link>
              </>
            )}
          </nav>
        )}
      </header>
      <Outlet />
    </div>
  )
}
