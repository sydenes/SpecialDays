import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  DEV_QUICK_LOGIN_EMAIL,
  DEV_QUICK_LOGIN_PASSWORD,
  isDevQuickLoginEnabled,
} from '../../lib/devQuickLogin.js'
import './authPages.css'

export function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/panom'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={from} replace />

  const doLogin = async (loginEmail, loginPassword) => {
    setError('')
    setSubmitting(true)
    try {
      await login(loginEmail.trim(), loginPassword)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Giriş başarısız')
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    doLogin(email, password)
  }

  const onQuickLogin = () => {
    setEmail(DEV_QUICK_LOGIN_EMAIL)
    setPassword(DEV_QUICK_LOGIN_PASSWORD)
    doLogin(DEV_QUICK_LOGIN_EMAIL, DEV_QUICK_LOGIN_PASSWORD)
  }

  return (
    <div className="auth-page">
      <h1>Giriş yap</h1>
      <p className="auth-page-sub">Sayfalarınızı yönetmek ve düzenlemek için hesabınıza giriş yapın.</p>
      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          E-posta
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Şifre
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
      </form>

      {isDevQuickLoginEnabled ? (
        <div className="auth-dev-quick">
          <p className="auth-dev-quick-label">Geliştirme</p>
          <button
            type="button"
            className="btn btn-dev-quick btn-block"
            disabled={submitting}
            onClick={onQuickLogin}
          >
            {submitting ? 'Giriş yapılıyor…' : 'Hızlı giriş (admin)'}
          </button>
          <p className="auth-dev-quick-hint">
            {DEV_QUICK_LOGIN_EMAIL} / {DEV_QUICK_LOGIN_PASSWORD}
          </p>
        </div>
      ) : null}

      <p className="auth-footer-link">
        Hesabınız yok mu? <Link to="/kayit">Kayıt olun</Link>
      </p>
    </div>
  )
}
