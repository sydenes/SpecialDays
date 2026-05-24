import { Link, Outlet, useLocation } from 'react-router-dom'
import './SiteLayout.css'

const RESERVED_SINGLE = new Set(['templates', 'create', 'edit', 'dashboard', 'published'])

export function SiteLayout() {
  const { pathname } = useLocation()
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
            <Link to="/dashboard">Panom</Link>
            <span className="site-nav-placeholder">Blog</span>
            <span className="site-nav-placeholder">Giriş</span>
          </nav>
        )}
      </header>
      <Outlet />
    </div>
  )
}
