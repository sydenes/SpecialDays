# SpecialDays — Durum, eksikler ve plan

Bu dosya commit öncesi **API + UI** için ortak bir fotoğraf verir. Kurulum adımları için `README.md`’e bakın; README’deki örnek SQL şeması gerçek projeden **eski** olabilir — güncel şema `api/initDb.ts` ve migrasyonlar ile tutulur.

---

## Şu an neredeyiz?

MVP seviyesinde uçtan uca akış çalışır durumda: şablon seçimi → sayfa oluşturma → metin/fotoğraf → slug ile yayınlanan sayfa → ziyaretçi mesajı. Fotoğraflar şimdilik **PostgreSQL `BYTEA`** içinde; CDN/S3 geçişi için veri modeli ve API tarafında harici URL yolu da korunuyor.

| Katman | Özet |
|--------|------|
| **API** | Express (TS), Postgres, public + dashboard uçları, inline foto yükleme ve servis, şablon `maxPhotos` / `maxTexts` kuralları |
| **UI** | React Router: landing, şablon seçimi, oluşturma formu, public sayfa (geri sayım, galeri, misafir formu), geliştirici panosu |
| **DB** | `init:db` tam kurulum + seed; `migrate` sadece şema güncellemesi (`page_photos` inline kolonları) |

---

## Tamamlanmış başlıca parçalar

### API

- Public: `GET /api/pages/:slug`, foto/metin/mesaj listeleri, `GET .../photos/:photoId/image` (BYTEA veya harici URL yönlendirmesi)
- Public şablon listesi: `GET /api/templates`, `GET /api/templates/:id`
- Dashboard: sayfa ve şablon CRUD, içerik `PUT` (foto anahtarı yoksa mevcut yüklemeler korunur), `POST/DELETE .../photos` ile dosya yükleme/silme
- Sayfa yanıtında `settings` (ör. tema rengi, müzik URL’si)
- Migrasyonlar: `api/src/db/migrations/pagePhotosInline.ts`, `npm run migrate`

### UI

- Pazarlama akışı: `/`, `/templates`, `/create`
- Yayın: `/:slug` (rezerve path’ler: `dashboard`, `templates`, `create`)
- Çoklu foto seçimi (biriktirme + kaldırma), panoda kuyruk + toplu yükleme
- `VITE_API_URL`, `VITE_DEFAULT_OWNER_USER_ID` (auth yokken sahip sayfası için geçici)

### Ortak / operasyon

- CORS, JSON body, slug formatı doğrulaması
- Şablon `contentRules` ile içerik üst sınırları

---

## Eksikler ve yapılması gerekenler (öncelik önerisi)

### Yüksek etki

1. **Kimlik doğrulama ve sahiplik** — Sayfa oluşturma şu an `ownerUserId` ile “elle” bağlı; giriş, JWT/session veya benzeri olmadan prod’a uygun değil.
2. **CDN / object storage** — Büyük trafik ve yedekleme için fotoğrafların S3/R2 vb. taşınması; DB’de yalnızca URL veya anahtar tutulması.
3. **README senkronu** — README’deki basit `special_pages` örneği gerçek tablolarla uyumlu değil; ya güncellenmeli ya da “detay için initDb” denmeli.
4. **Mesaj moderasyonu** — Public POST sonrası onay akışı (şu an seed/API tarafında onaylı mesaj örnekleri var; ürün politikası netleştirilmeli).

### Orta öncelik

5. **Şablon başına gerçek tasarım** — Kodda şablon seçimi var; farklı `templateCode` için ayrı React layout/CSS veya tema JSON’u.
6. **Dosya doğrulama ve güvenlik** — Boyut/MIME sunucuda sıkılaştırma, rate limit, isteğe bağlı virüs taraması.
7. **Hata ve yükleme UX’i** — Kısmi yükleme hatalarında geri alma, ilerleme çubuğu, ağ kesintisi mesajları.
8. **Testler** — API için birkaç entegrasyon testi (slug, yükleme limiti, migrasyon idempotency); UI için kritik akış smoke testi.

### Düşük / iyileştirme

9. **Özel alan adı / SSL** — `custom_domain` alanı şemada var; yönlendirme ve doğrulama yok.
10. **Analytics / ziyaret** — `page_visits` tablosu var; raporlama veya gizlilik uyumlu toplama eksik.
11. **E-posta bildirimleri** — Yeni mesajda sayfa sahibine mail yok.
12. **i18n** — Metinler karışık TR/EN; tutarlı dil paketi yok.

---

## Bilinçli olarak şimdilik yapılmayan / sınırlı tutulan

- Tam özellikli **blog** ve **giriş** (UI’da placeholder); ürün kapsamı dışında tutulabilir.
- **Çok kiracılı (multi-tenant)** abonelik ve faturalandırma.
- **Canlı düzenleme** (WYSIWYG) ve sürükle-bırak sayfa oluşturucu.
- Fotoğraf için **sunucu tarafı thumbnail** üretimi (şu an orijinal veya harici thumb URL).

Bunlar “yapmayız” değil; **MVP sonrası** veya ayrı epic olarak değerlendirilir.

---

## Commit öncesi hızlı kontrol listesi

- [ ] Root `.env`: `DATABASE_URL` (commit’e **eklenmemeli** — `.gitignore` doğrula)
- [ ] `ui`: `npm run build` temiz
- [ ] `api`: `npx tsc --noEmit` temiz
- [ ] Yeni ortamda: `npm run init:db` veya en azından `npm run migrate` (mevcut DB için)
- [ ] `node_modules` commit dışı

---

## Ortam değişkenleri özeti

| Değişken | Nerede | Amaç |
|----------|--------|------|
| `DATABASE_URL` | Root `.env` | Postgres bağlantısı (API) |
| `VITE_API_URL` | `ui/.env` (isteğe bağlı) | API tabanı; yoksa varsayılan localhost:4000 |
| `VITE_DEFAULT_OWNER_USER_ID` | `ui/.env` (isteğe bağlı) | Auth gelene kadar oluşturma akışında sahip UUID |

---

*Son güncelleme: proje içi MVP durumuna göre; backlog öncelikleri ürün kararıyla değişebilir.*
