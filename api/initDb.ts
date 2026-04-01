import dotenv from "dotenv";
import { Pool } from "pg";
import { fileURLToPath } from "url";
import { migrateCategoriesAndAssignments } from "./src/db/migrations/categoriesAndAssignments.js";
import { migratePagePhotosInline } from "./src/db/migrations/pagePhotosInline.js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL bulunamadi. Root dizinde .env dosyasi olusturulmalidir.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/** Tablolar + tetikleyiciler (sablon satiri yok; sablonlar migrate ile eklenir) */
const SQL_SCHEMA = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  preview_image_url TEXT,
  config_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL CHECK (code ~ '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$'),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS category_templates (
  category_id UUID NOT NULL REFERENCES page_categories(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (category_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_category_templates_category ON category_templates (category_id, sort_order);

CREATE TABLE IF NOT EXISTS special_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  template_id UUID NOT NULL REFERENCES templates(id),
  title TEXT NOT NULL,
  event_type TEXT,
  event_date TIMESTAMPTZ,
  main_text TEXT,
  hero_image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  access_password_hash TEXT,
  custom_domain TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  view_count BIGINT NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_special_pages_owner_user_id ON special_pages(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_special_pages_event_date ON special_pages(event_date);
CREATE INDEX IF NOT EXISTS idx_special_pages_status ON special_pages(status);

CREATE TABLE IF NOT EXISTS page_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES special_pages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_photos_page_id ON page_photos(page_id);
CREATE INDEX IF NOT EXISTS idx_page_photos_page_sort ON page_photos(page_id, sort_order);

CREATE TABLE IF NOT EXISTS page_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES special_pages(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT,
  message_text TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_messages_page_id ON page_messages(page_id);
CREATE INDEX IF NOT EXISTS idx_page_messages_approved ON page_messages(page_id, is_approved);

CREATE TABLE IF NOT EXISTS page_text_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES special_pages(id) ON DELETE CASCADE,
  block_key TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_text_blocks_page_id ON page_text_blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_page_text_blocks_page_sort ON page_text_blocks(page_id, sort_order);

CREATE TABLE IF NOT EXISTS page_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES special_pages(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_visits_page_id ON page_visits(page_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_visited_at ON page_visits(visited_at);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_templates_updated_at ON templates;
CREATE TRIGGER trg_templates_updated_at
BEFORE UPDATE ON templates
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_special_pages_updated_at ON special_pages;
CREATE TRIGGER trg_special_pages_updated_at
BEFORE UPDATE ON special_pages
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();
`;

const SQL_SEED = `
INSERT INTO users (full_name, email, password_hash)
VALUES ('Test User', 'test@example.com', 'testhash')
ON CONFLICT (email) DO NOTHING;

INSERT INTO special_pages (owner_user_id, slug, template_id, title, event_date, main_text, hero_image_url, is_public, status)
SELECT
  u.id,
  'john-and-martha',
  t.id,
  'John & Martha Wedding',
  TIMESTAMPTZ '2026-06-01T00:00:00Z',
  'John ve Martha''nin ozel gunu icin davetlisiniz!',
  NULL,
  TRUE,
  'published'
FROM users u
JOIN templates t ON t.code = 'tpl-gallery'
WHERE u.email = 'test@example.com'
ON CONFLICT (slug) DO UPDATE
SET
  template_id = EXCLUDED.template_id,
  title = EXCLUDED.title,
  event_date = EXCLUDED.event_date,
  main_text = EXCLUDED.main_text,
  is_public = EXCLUDED.is_public,
  status = EXCLUDED.status,
  published_at = NOW();

DELETE FROM page_photos
WHERE page_id = (SELECT id FROM special_pages WHERE slug = 'john-and-martha' LIMIT 1);

DELETE FROM page_messages
WHERE page_id = (SELECT id FROM special_pages WHERE slug = 'john-and-martha' LIMIT 1);

INSERT INTO page_photos (page_id, file_url, thumbnail_url, caption, sort_order)
SELECT
  id,
  'https://placehold.co/800x500/png?text=Wedding+Photo+1',
  'https://placehold.co/400x250/png?text=Wedding+Photo+1',
  'Ilk fotograf',
  1
FROM special_pages
WHERE slug = 'john-and-martha';

INSERT INTO page_photos (page_id, file_url, thumbnail_url, caption, sort_order)
SELECT
  id,
  'https://placehold.co/800x500/png?text=Wedding+Photo+2',
  'https://placehold.co/400x250/png?text=Wedding+Photo+2',
  'Ikinci fotograf',
  2
FROM special_pages
WHERE slug = 'john-and-martha';

INSERT INTO page_messages (page_id, author_name, author_email, message_text, is_approved, created_at)
SELECT
  id,
  'Ali',
  'ali@example.com',
  'John ve Martha! Mutluluklar dilerim.',
  TRUE,
  NOW()
FROM special_pages
WHERE slug = 'john-and-martha';

DELETE FROM page_text_blocks
WHERE page_id = (SELECT id FROM special_pages WHERE slug = 'john-and-martha' LIMIT 1);

INSERT INTO page_text_blocks (page_id, block_key, content, sort_order)
SELECT id, 'intro', 'Hos geldiniz! Bu ozel gunu birlikte kutluyoruz.', 1
FROM special_pages
WHERE slug = 'john-and-martha';

INSERT INTO page_text_blocks (page_id, block_key, content, sort_order)
SELECT id, 'story', 'Iliskimizin en guzel anilarini bu sayfada topladik.', 2
FROM special_pages
WHERE slug = 'john-and-martha';

INSERT INTO page_text_blocks (page_id, block_key, content, sort_order)
SELECT id, 'footer', 'Katildiginiz icin tesekkur ederiz.', 3
FROM special_pages
WHERE slug = 'john-and-martha';
`;

async function main() {
  try {
    console.log("DB init basliyor...");
    await pool.query(SQL_SCHEMA);
    await migratePagePhotosInline(pool);
    await migrateCategoriesAndAssignments(pool);
    await pool.query(SQL_SEED);
    console.log("DB init tamamlandi.");
    await pool.end();
  } catch (err) {
    console.error("DB init basarisiz:", err);
    await pool.end();
    process.exit(1);
  }
}

main();
