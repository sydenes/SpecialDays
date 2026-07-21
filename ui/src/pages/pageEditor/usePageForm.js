import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE, apiFetch } from '../../lib/api.js'
import {
  getStockPhotosForCategory,
  stockFileName,
  stockIdFromFileName,
  stockImageToFile,
} from '../../lib/defaultPhotos.js'
import { DEV_PREFILL_ENABLED, resolveDevPrefill } from './devPrefill.js'
import {
  fileDedupeKey,
  inferCategoryFromPage,
  mergePickedFiles,
  parseContentRuleNumber,
  photoLimitMessage,
  remainingPhotoSlots,
  textBlockKeys,
  toDatetimeLocalValue,
} from './pageFormUtils.js'
import {
  defaultPageComponents,
  listToggleableForTemplate,
  resolvePageComponentsState,
  serializePageComponents,
} from '../../lib/pageComponents.js'

/**
 * @param {{ mode: 'create' | 'edit', editSlug?: string }} options
 */
export function usePageForm({ mode, editSlug }) {
  const isEdit = mode === 'edit'
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const templateFromState = location.state?.template
  const categoryFromPick = location.state?.categoryCode

  const [template, setTemplate] = useState(templateFromState || null)
  const [pageId, setPageId] = useState('')
  const [existingPhotos, setExistingPhotos] = useState([])
  const [photosToDelete, setPhotosToDelete] = useState(() => new Set())
  const [loadingPage, setLoadingPage] = useState(isEdit)
  const [editCategory, setEditCategory] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [mainText, setMainText] = useState('')
  const [photoFiles, setPhotoFiles] = useState([])
  const [selectedStockIds, setSelectedStockIds] = useState(() => new Set())
  const [stockLoadingId, setStockLoadingId] = useState(null)
  const [textByKey, setTextByKey] = useState({})
  const [themeColor, setThemeColor] = useState('#c41e3a')
  const [musicUrl, setMusicUrl] = useState('')
  const [musicId, setMusicId] = useState('')
  const [giftBankName, setGiftBankName] = useState('')
  const [giftRecipientName, setGiftRecipientName] = useState('')
  const [giftIban, setGiftIban] = useState('')
  const [locationVenueName, setLocationVenueName] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  const [locationLat, setLocationLat] = useState(/** @type {number | null} */ (null))
  const [locationLon, setLocationLon] = useState(/** @type {number | null} */ (null))
  const [pageComponents, setPageComponents] = useState(() => defaultPageComponents(templateFromState))
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formInfo, setFormInfo] = useState('')
  const [devPrefilled, setDevPrefilled] = useState(false)
  const [pageStatus, setPageStatus] = useState('draft')
  const [previewToken, setPreviewToken] = useState('')
  const [slugCheck, setSlugCheck] = useState({ status: 'idle', message: '' })

  const templateIdParam = searchParams.get('templateId')
  const stockCategory = categoryFromPick || editCategory || 'shared'

  useEffect(() => {
    if (!isEdit || !editSlug) return undefined
    let cancelled = false
    ;(async () => {
      setLoadingPage(true)
      setLoadError('')
      try {
        const pageRes = await apiFetch(`/api/me/pages/by-slug/${encodeURIComponent(editSlug)}`)
        if (pageRes.status === 403) throw new Error('forbidden')
        if (!pageRes.ok) throw new Error('page')
        const page = await pageRes.json()
        const [contentRes, tplRes] = await Promise.all([
          apiFetch(`/api/me/pages/${page.id}/content`),
          fetch(`${API_BASE}/api/templates/${page.templateId}`),
        ])
        if (!contentRes.ok || !tplRes.ok) throw new Error('related')
        const content = await contentRes.json()
        const tpl = await tplRes.json()
        if (cancelled) return

        setPageId(page.id)
        setPageStatus(page.status || 'draft')
        setPreviewToken(page.previewToken || '')
        setSlug(page.slug || '')
        setTitle(page.title || '')
        setEventDate(toDatetimeLocalValue(page.eventDate))
        setMainText(page.mainText || '')
        setThemeColor(
          (page.settings && typeof page.settings.themeColor === 'string' && page.settings.themeColor) || '#c41e3a'
        )
        setMusicUrl(
          (page.settings && typeof page.settings.musicUrl === 'string' && page.settings.musicUrl) || ''
        )
        setMusicId(
          (page.settings && typeof page.settings.musicId === 'string' && page.settings.musicId) || ''
        )
        const resolvedComponents = resolvePageComponentsState(page.settings, tpl)
        if (page.settings?.giftEnabled === true) {
          resolvedComponents.gift = true
        }
        if (page.settings?.locationEnabled === true) {
          resolvedComponents.location = true
        }
        setPageComponents(resolvedComponents)
        setGiftBankName(
          (page.settings && typeof page.settings.giftBankName === 'string' && page.settings.giftBankName) || ''
        )
        setGiftRecipientName(
          (page.settings &&
            typeof page.settings.giftRecipientName === 'string' &&
            page.settings.giftRecipientName) ||
            ''
        )
        setGiftIban(
          (page.settings && typeof page.settings.giftIban === 'string' && page.settings.giftIban) || ''
        )
        setLocationVenueName(
          (page.settings && typeof page.settings.locationVenueName === 'string' && page.settings.locationVenueName) ||
            ''
        )
        setLocationAddress(
          (page.settings && typeof page.settings.locationAddress === 'string' && page.settings.locationAddress) || ''
        )
        setLocationLat(
          page.settings && typeof page.settings.locationLat === 'number' ? page.settings.locationLat : null
        )
        setLocationLon(
          page.settings && typeof page.settings.locationLon === 'number' ? page.settings.locationLon : null
        )
        setExistingPhotos(content.photos || [])
        setPhotosToDelete(new Set())
        setPhotoFiles([])
        setSelectedStockIds(new Set())
        setEditCategory(inferCategoryFromPage(page))

        const texts = content.texts || []
        const nextText = {}
        for (const t of texts) {
          if (t.blockKey) nextText[t.blockKey] = t.content || ''
        }
        setTextByKey(nextText)
        setTemplate(tpl)
      } catch (err) {
        if (!cancelled) {
          setLoadError(err?.message === 'forbidden' ? 'Bu sayfayı düzenleme yetkiniz yok.' : 'Sayfa yüklenemedi.')
          setTemplate(null)
        }
      } finally {
        if (!cancelled) setLoadingPage(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isEdit, editSlug])

  useEffect(() => {
    const raw = slug.trim().toLowerCase()
    if (!raw) {
      setSlugCheck({ status: 'idle', message: '' })
      return undefined
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw)) {
      setSlugCheck({
        status: 'invalid',
        message: 'Yalnızca küçük harf, rakam ve tire kullanın.',
      })
      return undefined
    }

    // Düzenlemede slug değişmediyse kontrol atlanır
    if (isEdit && editSlug && raw === editSlug.trim().toLowerCase()) {
      setSlugCheck({ status: 'available', message: 'Mevcut adresiniz.' })
      return undefined
    }

    let cancelled = false
    setSlugCheck({ status: 'checking', message: 'Kontrol ediliyor…' })
    const timer = setTimeout(async () => {
      try {
        const q = pageId ? `?excludePageId=${encodeURIComponent(pageId)}` : ''
        const res = await apiFetch(`/api/me/pages/slug-available/${encodeURIComponent(raw)}${q}`)
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (data.available) {
          setSlugCheck({ status: 'available', message: 'Bu adres müsait.' })
        } else {
          setSlugCheck({
            status: data.reason === 'invalid' ? 'invalid' : 'unavailable',
            message:
              typeof data.error === 'string' && data.error.trim()
                ? data.error.trim()
                : 'Bu adres kullanılamıyor.',
          })
        }
      } catch {
        if (!cancelled) {
          setSlugCheck({ status: 'idle', message: '' })
        }
      }
    }, 450)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [slug, pageId, isEdit, editSlug])

  useEffect(() => {
    if (isEdit) return
    if (templateFromState) {
      setTemplate(templateFromState)
      return
    }
    const id = templateIdParam
    if (!id) {
      setTemplate(null)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadError('')
      try {
        const res = await fetch(`${API_BASE}/api/templates/${id}`)
        if (!res.ok) throw new Error('not found')
        const data = await res.json()
        if (!cancelled) setTemplate(data)
      } catch {
        if (!cancelled) {
          setTemplate(null)
          setLoadError('Şablon bulunamadı.')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isEdit, templateFromState, templateIdParam])

  const keys = useMemo(() => (template ? textBlockKeys(template) : []), [template])
  const stockPhotos = useMemo(() => getStockPhotosForCategory(stockCategory), [stockCategory])
  const toggleable = useMemo(() => listToggleableForTemplate(template), [template])
  const giftEnabled = pageComponents?.gift !== false
  const locationEnabled = pageComponents?.location !== false

  useEffect(() => {
    if (!template) return
    setPageComponents((prev) => {
      const defaults = defaultPageComponents(template)
      if (!prev || Object.keys(prev).length === 0) return defaults
      return resolvePageComponentsState({ components: prev }, template)
    })
  }, [template?.id, template?.code])

  useEffect(() => {
    if (isEdit) return
    setPhotoFiles([])
    setSelectedStockIds(new Set())
  }, [isEdit, categoryFromPick, template?.id])

  useEffect(() => {
    if (!template || keys.length === 0) return
    setTextByKey((prev) => {
      const next = { ...prev }
      for (const k of keys) {
        if (next[k] === undefined) next[k] = ''
      }
      return next
    })
  }, [template, keys])

  const devPrefill = useMemo(() => resolveDevPrefill(categoryFromPick), [categoryFromPick])

  useEffect(() => {
    setDevPrefilled(false)
  }, [categoryFromPick, template?.id])

  useEffect(() => {
    if (isEdit || !DEV_PREFILL_ENABLED || !template || devPrefilled) return

    setSlug(devPrefill.slug)
    setTitle(devPrefill.title)
    setEventDate(devPrefill.eventDate)
    setMainText(devPrefill.mainText)
    setThemeColor(devPrefill.themeColor)
    setMusicUrl(devPrefill.musicUrl || '')
    setMusicId(devPrefill.musicId || '')

    if (keys.length > 0) {
      setTextByKey((prev) => {
        const next = { ...prev }
        keys.forEach((k, i) => {
          next[k] = devPrefill.textFallbacks[i] || devPrefill.textFallbacks.at(-1) || ''
        })
        return next
      })
    }

    setDevPrefilled(true)
  }, [isEdit, template, keys, devPrefilled, devPrefill])

  const maxPhotos = parseContentRuleNumber(template?.configSchema?.contentRules?.maxPhotos)
  const maxTexts = parseContentRuleNumber(template?.configSchema?.contentRules?.maxTexts)
  const keptExistingCount = existingPhotos.filter((p) => !photosToDelete.has(p.id)).length
  const totalPhotoCount = keptExistingCount + photoFiles.length
  const remainingSlots = remainingPhotoSlots(maxPhotos, keptExistingCount, photoFiles.length)
  const photoLimitReached = typeof maxPhotos === 'number' && remainingSlots === 0

  const markExistingPhotoDeleted = (photoId) => {
    setPhotosToDelete((prev) => new Set([...prev, photoId]))
  }

  const removePhotoAt = (index) => {
    const file = photoFiles[index]
    setPhotoFiles((prev) => prev.filter((_, j) => j !== index))
    if (file) {
      const stockId = stockIdFromFileName(file.name)
      if (stockId) {
        setSelectedStockIds((prev) => {
          const next = new Set(prev)
          next.delete(stockId)
          return next
        })
      }
    }
  }

  const addPhotoFiles = (incoming) => {
    if (!incoming?.length) return
    setFormError('')
    setPhotoFiles((prev) => {
      const kept = existingPhotos.filter((p) => !photosToDelete.has(p.id)).length
      const max = parseContentRuleNumber(template?.configSchema?.contentRules?.maxPhotos)
      const queueCap = typeof max === 'number' ? Math.max(0, max - kept) : null
      const next = mergePickedFiles(prev, incoming, queueCap)
      if (typeof max === 'number' && next.length === prev.length) {
        queueMicrotask(() => setFormError(photoLimitMessage(max)))
      } else if (typeof max === 'number' && next.length - prev.length < incoming.length) {
        queueMicrotask(() => setFormError(photoLimitMessage(max)))
      }
      return next
    })
  }

  const toggleStockPhoto = async (stock) => {
    if (selectedStockIds.has(stock.id)) {
      setPhotoFiles((prev) => prev.filter((f) => f.name !== stockFileName(stock.id)))
      setSelectedStockIds((prev) => {
        const next = new Set(prev)
        next.delete(stock.id)
        return next
      })
      return
    }

    try {
      setStockLoadingId(stock.id)
      setFormError('')
      const file = await stockImageToFile(stockCategory, stock)
      let blocked = false
      setPhotoFiles((prev) => {
        const kept = existingPhotos.filter((p) => !photosToDelete.has(p.id)).length
        const max = parseContentRuleNumber(template?.configSchema?.contentRules?.maxPhotos)
        const queueCap = typeof max === 'number' ? Math.max(0, max - kept) : null
        const next = mergePickedFiles(prev, [file], queueCap)
        if (next.length === prev.length) {
          blocked = true
          return prev
        }
        return next
      })
      if (blocked) {
        const max = parseContentRuleNumber(template?.configSchema?.contentRules?.maxPhotos)
        if (typeof max === 'number') setFormError(photoLimitMessage(max))
        return
      }
      setSelectedStockIds((prev) => new Set([...prev, stock.id]))
    } catch {
      setFormError('Hazır görsel yüklenemedi. Dosyanın public/images/templates altında olduğundan emin olun.')
    } finally {
      setStockLoadingId(null)
    }
  }

  const savePage = async (publish) => {
    setFormError('')
    setFormInfo('')
    if (!template) {
      setFormError('Şablon bilgisi eksik. Lütfen kategoriden şablon seçerek tekrar deneyin.')
      return
    }

    const s = slug.trim().toLowerCase()
    const t = title.trim()
    if (!s || !t) {
      setFormError('Sayfa adresi (slug) ve başlık zorunludur.')
      return
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
      setFormError('Slug yalnızca küçük harf, rakam ve tire içerebilir.')
      return
    }
    if (slugCheck.status === 'unavailable' || slugCheck.status === 'invalid') {
      setFormError(slugCheck.message || 'Bu sayfa adresi kullanılamıyor.')
      return
    }
    if (slugCheck.status === 'checking') {
      setFormError('Sayfa adresi kontrolü bitene kadar bekleyin.')
      return
    }

    if (totalPhotoCount === 0) {
      setFormError(
        'En az bir fotoğraf seçmelisiniz. Kendi fotoğrafınızı yükleyebilir veya hazır görsellerden seçebilirsiniz.'
      )
      return
    }

    if (typeof maxPhotos === 'number' && totalPhotoCount > maxPhotos) {
      setFormError(photoLimitMessage(maxPhotos))
      return
    }

    if (giftEnabled && !giftIban.replace(/\s+/g, '').trim()) {
      setFormError('Dijital takı açıkken IBAN numarası gerekli.')
      return
    }

    if (locationEnabled && !locationVenueName.trim() && !locationAddress.trim()) {
      setFormError('Konum açıkken mekan adı veya adres gerekli.')
      return
    }

    const texts = keys
      .filter((blockKey) => pageComponents?.texts?.[blockKey] !== false)
      .map((blockKey, i) => ({
        blockKey,
        content: (textByKey[blockKey] || '').trim(),
        sortOrder: i + 1,
      }))
      .filter((x) => x.content)

    if (typeof maxTexts === 'number' && texts.length > maxTexts) {
      setFormError(`Bu şablonda en fazla ${maxTexts} metin bloğu kullanılabilir.`)
      return
    }

    let eventIso = null
    if (eventDate) {
      const d = new Date(eventDate)
      if (!Number.isNaN(d.getTime())) eventIso = d.toISOString()
    }

    const nextStatus = publish ? 'published' : 'draft'
    const nextIsPublic = publish

    setSubmitting(true)
    let redirect = null
    try {
      let targetPageId = pageId
      let nextPreviewToken = previewToken

      if (isEdit) {
        const patchRes = await apiFetch(`/api/me/pages/${pageId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            slug: s,
            title: t,
            eventDate: eventIso,
            mainText: pageComponents?.mainText === false ? null : mainText.trim() || null,
            status: nextStatus,
            isPublic: nextIsPublic,
          }),
        })
        const patchBody = await patchRes.json().catch(() => ({}))
        if (!patchRes.ok) {
          setFormError(
            typeof patchBody?.error === 'string' && patchBody.error.trim()
              ? patchBody.error.trim()
              : 'Sayfa güncellenemedi.'
          )
          return
        }
        if (patchBody.previewToken) nextPreviewToken = patchBody.previewToken

        for (const photoId of photosToDelete) {
          const del = await apiFetch(`/api/me/pages/${pageId}/photos/${photoId}`, {
            method: 'DELETE',
          })
          if (!del.ok) {
            setFormError('Fotoğraf silinemedi.')
            return
          }
        }
      } else {
        const createRes = await apiFetch('/api/me/pages', {
          method: 'POST',
          body: JSON.stringify({
            slug: s,
            templateId: template.id,
            title: t,
            eventDate: eventIso,
            mainText: pageComponents?.mainText === false ? null : mainText.trim() || null,
            status: nextStatus,
            isPublic: nextIsPublic,
            settings: {},
          }),
        })
        const createRaw = await createRes.text()
        let createdBody = {}
        try {
          createdBody = createRaw ? JSON.parse(createRaw) : {}
        } catch {
          createdBody = {}
        }
        if (!createRes.ok) {
          const msg =
            typeof createdBody?.error === 'string' && createdBody.error.trim()
              ? createdBody.error.trim()
              : `Sayfa oluşturulamadı (HTTP ${createRes.status}).`
          setFormError(msg)
          return
        }
        targetPageId = createdBody.id
        nextPreviewToken = createdBody.previewToken || ''
        setPageId(createdBody.id)
      }

      for (const file of photoFiles) {
        if (typeof maxPhotos === 'number') {
          const countRes = await apiFetch(`/api/me/pages/${targetPageId}/content`)
          if (countRes.ok) {
            const content = await countRes.json()
            const onServer = (content.photos || []).length
            if (onServer >= maxPhotos) {
              setFormError(photoLimitMessage(maxPhotos))
              return
            }
          }
        }

        const fd = new FormData()
        fd.append('file', file)
        const up = await apiFetch(`/api/me/pages/${targetPageId}/photos`, {
          method: 'POST',
          body: fd,
        })
        if (!up.ok) {
          const errBody = await up.json().catch(() => ({}))
          const apiErr = typeof errBody?.error === 'string' ? errBody.error : ''
          if (apiErr.includes('maximum') && typeof maxPhotos === 'number') {
            setFormError(photoLimitMessage(maxPhotos))
          } else {
            setFormError(apiErr || 'Fotoğraf yüklenemedi.')
          }
          return
        }
      }

      const contentRes = await apiFetch(`/api/me/pages/${targetPageId}/content`, {
        method: 'PUT',
        body: JSON.stringify({
          texts,
          themeColor: themeColor.trim() || null,
          musicUrl: pageComponents?.music === false ? null : musicId.trim() ? null : musicUrl.trim() || null,
          musicId: pageComponents?.music === false ? null : musicId.trim() || null,
          giftEnabled: Boolean(giftEnabled),
          giftBankName: giftEnabled ? giftBankName.trim() || null : null,
          giftRecipientName: giftEnabled ? giftRecipientName.trim() || null : null,
          giftIban: giftEnabled ? giftIban.replace(/\s+/g, '').toUpperCase() || null : null,
          locationEnabled: Boolean(locationEnabled),
          locationVenueName: locationEnabled ? locationVenueName.trim() || null : null,
          locationAddress: locationEnabled ? locationAddress.trim() || null : null,
          locationLat: locationEnabled && locationLat != null ? locationLat : null,
          locationLon: locationEnabled && locationLon != null ? locationLon : null,
          components: serializePageComponents(pageComponents, template),
        }),
      })
      const contentBody = await contentRes.json().catch(() => ({}))
      if (!contentRes.ok) {
        setFormError(contentBody?.error || 'İçerik kaydedilemedi.')
        return
      }

      redirect = {
        path: `/published/${s}`,
        state: {
          title: t,
          wasEdit: isEdit,
          outcome: publish ? 'published' : 'draft',
          previewToken: nextPreviewToken,
        },
      }
    } catch (err) {
      console.error('Sayfa kaydetme hatası:', err)
      setFormError('Sunucuya bağlanılamadı.')
    } finally {
      setSubmitting(false)
    }

    if (redirect) {
      navigate(redirect.path, { replace: true, state: redirect.state })
    }
  }

  const onSaveDraft = (e) => {
    e.preventDefault()
    savePage(false)
  }

  const onPublish = (e) => {
    e.preventDefault()
    savePage(true)
  }

  const dismissError = () => setFormError('')
  const dismissInfo = () => setFormInfo('')

  return {
    isEdit,
    editSlug,
    categoryFromPick,
    template,
    loadError,
    loadingPage,
    slug,
    setSlug,
    slugCheck,
    title,
    setTitle,
    eventDate,
    setEventDate,
    mainText,
    setMainText,
    themeColor,
    setThemeColor,
    musicUrl,
    setMusicUrl,
    musicId,
    setMusicId,
    pageComponents,
    setPageComponents,
    toggleable,
    giftEnabled,
    giftBankName,
    setGiftBankName,
    giftRecipientName,
    setGiftRecipientName,
    giftIban,
    setGiftIban,
    locationEnabled,
    locationVenueName,
    setLocationVenueName,
    locationAddress,
    setLocationAddress,
    locationLat,
    setLocationLat,
    locationLon,
    setLocationLon,
    keys,
    textByKey,
    setTextByKey,
    maxPhotos,
    maxTexts,
    totalPhotoCount,
    remainingSlots,
    photoLimitReached,
    existingPhotos,
    photosToDelete,
    photoFiles,
    stockPhotos,
    stockCategory,
    selectedStockIds,
    stockLoadingId,
    submitting,
    formError,
    formInfo,
    dismissError,
    dismissInfo,
    markExistingPhotoDeleted,
    removePhotoAt,
    addPhotoFiles,
    toggleStockPhoto,
    pageStatus,
    previewToken,
    onSaveDraft,
    onPublish,
  }
}
