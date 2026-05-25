import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="auth-loading">Oturum kontrol ediliyor…</p>
  }

  if (!user) {
    return <Navigate to="/giris" replace state={{ from: location.pathname }} />
  }

  return children
}

export function RequireAdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="auth-loading">Oturum kontrol ediliyor…</p>
  }

  if (!user) {
    return <Navigate to="/giris" replace state={{ from: location.pathname }} />
  }

  if (!isAdmin) {
    return <Navigate to="/panom" replace />
  }

  return children
}
