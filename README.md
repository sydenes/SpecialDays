## SpecialDays - Node.js & React MVP

Basit bir MVP proje iskeleti:

- **Backend (`api`)**: Node.js + Express + Postgres
  - Örnek endpoint: `GET /api/pages/:slug`
  - Amaç: slug (örn: `john-and-martha`) ile özel gün sayfası verisini döndürmek
- **Frontend (`ui`)**: React + Vite
  - URL path tabanlı routing (örn: `http://localhost:5173/john-and-martha`)
  - Slug'a göre backend'den sayfa verisini çeker ve gösterir

### Kurulum

1. **Postgres ayarları**

`specialdays` isminde bir veritabanı oluştur ve `.env` dosyanı root dizinde hazırla:

`.env` içeriği (örnek):

```bash
DATABASE_URL=postgres://user:password@localhost:5432/specialdays
```

Örnek tablo şeması:

```sql
CREATE TABLE special_pages (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  event_date TIMESTAMP NULL,
  main_text TEXT
);
```

Test kaydı:

```sql
INSERT INTO special_pages (slug, template_id, title, event_date, main_text)
VALUES (
  'john-and-martha',
  'wedding-basic',
  'John & Martha Wedding',
  '2026-06-01',
  'John ve Martha\'nın özel günü için davetlisiniz!'
);
```

2. **Backend (api)**

```bash
cd api
npm run dev
```

Çalıştığında:

- Sağlık kontrolü: `http://localhost:4000/health`
- Örnek sayfa: `http://localhost:4000/api/pages/john-and-martha`

3. **Frontend (ui)**

```bash
cd ui
npm run dev
```

Varsayılan Vite portu: `http://localhost:5173`

- Slug alanına `john-and-martha` yazdığında backend'den gelen sayfayı önizlersin.
- URL'i doğrudan `http://localhost:5173/john-and-martha` şeklinde açtığında da aynı veriyi çeker.

### Sonraki adımlar (öneri)

- Şablon sistemi eklemek (farklı template tasarımları)
- Fotoğraf yükleme / galeri alanı
- Şifre korumalı sayfalar
- Davetlilerin mesaj bırakabildiği bölüm

