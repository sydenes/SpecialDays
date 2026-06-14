import { PageOgHead } from './PageOgHead.jsx'
import { usePageOgMeta } from '../hooks/usePageOgMeta.js'

export function PublicPageOgHead({ slug, page }) {
  const og = usePageOgMeta({ slug, page })
  if (!og) return null
  return <PageOgHead og={og} />
}
