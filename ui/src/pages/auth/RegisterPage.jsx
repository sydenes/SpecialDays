import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import './authPages.css'

export function RegisterPage() {
  const { register, user } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/panom" replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.')
      return
    }
    setSubmitting(true)
    try {
      await register(fullName.trim(), email.trim(), password)
      navigate('/panom', { replace: true })
    } catch (err) {
      setError(err.message || 'Kayıt başarısız')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <h1>Hesap oluştur</h1>
      <p className="auth-page-sub">Özel gün sayfanızı oluşturmak ve taslak olarak kaydetmek için ücretsiz kayıt olun.</p>
      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          Ad soyad
          <input type="text" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          E-posta
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Şifre (en az 8 karakter)
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Kaydediliyor…' : 'Kayıt ol'}
        </button>
      </form>
      <p className="auth-footer-link">
        Zaten hesabınız var mı? <Link to="/giris">Giriş yapın</Link>
      </p>
    </div>
  )
}
