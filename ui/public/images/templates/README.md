# Varsayılan şablon görselleri

Bu klasördeki görseller, kullanıcı kendi fotoğrafını yüklemeden sayfa oluştururken seçebileceği hazır görsellerdir.

## Klasör yapısı

```
images/templates/
  wedding/      — düğün / nişan
  birthday/     — doğum günü
  anniversary/  — yıldönümü
  shared/       — diğer kategoriler (yedek)
```

## Yeni görsel ekleme

1. İlgili kategoriye `01.jpg`, `02.jpg` … adıyla dosya ekleyin (JPEG/PNG/WebP).
2. `ui/src/lib/defaultPhotos.js` içindeki listeye aynı dosya adını ekleyin.

Örnek:

```js
{ id: 'wedding-04', file: '04.jpg', label: 'Kısa açıklama' }
```

Görseller `public/` altında olduğu için derleme gerekmez; dosyayı kaydedip sayfayı yenilemeniz yeterli.
