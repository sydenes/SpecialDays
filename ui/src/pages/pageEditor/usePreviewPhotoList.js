import { useEffect, useMemo, useState } from 'react'
import { photoSrc } from '../../lib/photoUrl.js'
import { fileDedupeKey } from './pageFormUtils.js'

/**
 * Mevcut sunucu fotoğrafları + henüz yüklenmemiş File kuyruğu → önizleme URL listesi.
 */
export function usePreviewPhotoList(existingPhotos, photosToDelete, photoFiles) {
  const [objectUrls, setObjectUrls] = useState([])

  useEffect(() => {
    const urls = photoFiles.map((f) => URL.createObjectURL(f))
    setObjectUrls(urls)
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [photoFiles])

  return useMemo(() => {
    const kept = (existingPhotos || []).filter((p) => !photosToDelete.has(p.id))
    const fromExisting = kept.map((p) => ({
      id: p.id,
      url: photoSrc(p.thumbnailUrl || p.fileUrl),
    }))
    const fromFiles = photoFiles
      .map((f, i) => ({
        id: `preview-file-${fileDedupeKey(f)}`,
        url: objectUrls[i] || '',
      }))
      .filter((x) => x.url)
    return [...fromExisting, ...fromFiles]
  }, [existingPhotos, photosToDelete, photoFiles, objectUrls])
}
