import { Link } from 'react-router-dom'
import { PageFormView } from './PageFormView.jsx'
import { usePageForm } from './usePageForm.js'
import '../flowPages.css'

/**
 * @param {{ mode: 'create' | 'edit', editSlug?: string }} props
 */
export function PageForm({ mode, editSlug }) {
  const isEdit = mode === 'edit'
  const form = usePageForm({ mode, editSlug })

  if (form.loadingPage) {
    return (
      <section className="flow-section">
        <p className="flow-lead">Sayfa yükleniyor…</p>
      </section>
    )
  }

  if (!form.template && form.loadError) {
    return (
      <section className="flow-section">
        <p className="error-banner">{form.loadError}</p>
        <p>
          {isEdit ? (
            <Link to="/dashboard">Panele dön</Link>
          ) : (
            <Link to="/templates">Şablon seç</Link>
          )}
        </p>
      </section>
    )
  }

  if (!form.template) {
    return (
      <section className="flow-section">
        <h1>{isEdit ? 'Sayfa düzenle' : 'Sayfa oluştur'}</h1>
        <p className="flow-lead">{isEdit ? 'Sayfa bulunamadı.' : 'Önce bir şablon seçmelisiniz.'}</p>
        {isEdit ? (
          <Link to="/dashboard" className="btn btn-primary">
            Panele dön
          </Link>
        ) : (
          <Link to="/templates" className="btn btn-primary">
            Şablonlara git
          </Link>
        )}
      </section>
    )
  }

  return <PageFormView {...form} template={form.template} />
}
