import { Link, useParams } from 'react-router-dom'
import { PageForm } from './pageEditor/PageForm.jsx'
import './flowPages.css'

export function EditPage() {
  const { slug } = useParams()

  if (!slug) {
    return (
      <section className="flow-section">
        <p className="error-banner">Geçersiz düzenleme adresi.</p>
        <p>
          <Link to="/dashboard">Panele dön</Link>
        </p>
      </section>
    )
  }

  return <PageForm mode="edit" editSlug={slug} />
}
