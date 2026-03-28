import { Link } from 'react-router-dom'
import './flowPages.css'

export function Home() {
  return (
    <div className="flow-page">
      <section className="hero">
        <div className="hero-bg" aria-hidden />
        <div className="hero-inner">
          <h1 className="hero-title">Özel Gün Sayfanızı Oluşturun</h1>
          <p className="hero-sub">
            Düğün, yıldönümü, doğum günü ve daha fazlası için anılarınızı paylaşın.
          </p>
          <Link to="/templates" className="btn btn-primary btn-lg">
            Başlayın
          </Link>
        </div>
      </section>

      <section className="steps-strip">
        <div className="steps-inner">
          <div className="step-card">
            <div className="step-icon" aria-hidden>
              📄
            </div>
            <h3>Şablon seçin</h3>
            <p>Etkinliğinize uygun bir tasarım seçin.</p>
          </div>
          <div className="step-card">
            <div className="step-icon" aria-hidden>
              🖼️
            </div>
            <h3>Fotoğraf ve mesaj</h3>
            <p>Görsellerinizi ve metinlerinizi ekleyin.</p>
          </div>
          <div className="step-card">
            <div className="step-icon" aria-hidden>
              🔗
            </div>
            <h3>Paylaşın</h3>
            <p>Kendi bağlantınızla yayınlayın.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
