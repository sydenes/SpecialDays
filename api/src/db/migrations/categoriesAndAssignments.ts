import type { Pool } from "pg";

/**
 * Etkinlik kategorileri + sablon (A/B/C) iliskisi.
 * tpl-classic=A, tpl-gallery=B, tpl-minimal=C
 * Dugun: B+C, Dogum gunu: A+C, Yildonumu: sadece C
 */
const STEPS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS page_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL CHECK (code ~ '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$'),
    name TEXT NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS category_templates (
    category_id UUID NOT NULL REFERENCES page_categories(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (category_id, template_id)
  )
  `,
  `CREATE INDEX IF NOT EXISTS idx_category_templates_category ON category_templates (category_id, sort_order)`,

  `ALTER TABLE templates ALTER COLUMN category DROP NOT NULL`,

  // --- Sablonlar (paylasimli A/B/C) ---
  `INSERT INTO templates (code, name, category, preview_image_url, config_schema, is_active)
   VALUES (
     'tpl-classic',
     'Klasik kartlar',
     'shared',
     NULL,
     '{"layout":"stacked","contentRules":{"maxPhotos":5,"maxTexts":2},"textBlocks":[{"key":"welcome","label":"Karşılama"},{"key":"details","label":"Detaylar"}],"optionalSettings":{"themeColor":true,"musicUrl":true},"components":{"countdown":true,"guestbook":true}}'::jsonb,
     TRUE
   )
   ON CONFLICT (code) DO UPDATE SET
     name = EXCLUDED.name,
     category = EXCLUDED.category,
     config_schema = EXCLUDED.config_schema,
     is_active = EXCLUDED.is_active`,

  `INSERT INTO templates (code, name, category, preview_image_url, config_schema, is_active)
   VALUES (
     'tpl-gallery',
     'Galeri & hikaye',
     'shared',
     NULL,
     '{"layout":"split-hero","contentRules":{"maxPhotos":10,"maxTexts":3},"textBlocks":[{"key":"intro","label":"Giriş metni"},{"key":"story","label":"Hikaye"},{"key":"footer","label":"Alt bilgi"}],"optionalSettings":{"themeColor":true,"musicUrl":true},"components":{"countdown":true,"guestbook":true}}'::jsonb,
     TRUE
   )
   ON CONFLICT (code) DO UPDATE SET
     name = EXCLUDED.name,
     category = EXCLUDED.category,
     config_schema = EXCLUDED.config_schema,
     is_active = EXCLUDED.is_active`,

  `INSERT INTO templates (code, name, category, preview_image_url, config_schema, is_active)
   VALUES (
     'tpl-minimal',
     'Sade & zarif',
     'shared',
     NULL,
     '{"layout":"minimal","contentRules":{"maxPhotos":3,"maxTexts":1},"textBlocks":[{"key":"message","label":"Mesajınız"}],"optionalSettings":{"themeColor":true,"musicUrl":true},"components":{"countdown":true,"guestbook":true}}'::jsonb,
     TRUE
   )
   ON CONFLICT (code) DO UPDATE SET
     name = EXCLUDED.name,
     category = EXCLUDED.category,
     config_schema = EXCLUDED.config_schema,
     is_active = EXCLUDED.is_active`,

  `INSERT INTO page_categories (code, name, description, sort_order, is_active)
   VALUES
     ('wedding', 'Düğün', NULL, 1, TRUE),
     ('birthday', 'Doğum günü', NULL, 2, TRUE),
     ('anniversary', 'Yıldönümü', NULL, 3, TRUE)
   ON CONFLICT (code) DO UPDATE SET
     name = EXCLUDED.name,
     sort_order = EXCLUDED.sort_order,
     is_active = EXCLUDED.is_active`,

  // Dugun: B (gallery) + C (minimal)
  `INSERT INTO category_templates (category_id, template_id, sort_order)
   SELECT c.id, t.id, v.ord
   FROM page_categories c
   CROSS JOIN (VALUES ('wedding', 'tpl-gallery', 1), ('wedding', 'tpl-minimal', 2)) AS v(cat, tcode, ord)
   JOIN templates t ON t.code = v.tcode
   WHERE c.code = v.cat
   ON CONFLICT (category_id, template_id) DO UPDATE SET sort_order = EXCLUDED.sort_order`,

  // Dogum gunu: A + C
  `INSERT INTO category_templates (category_id, template_id, sort_order)
   SELECT c.id, t.id, v.ord
   FROM page_categories c
   CROSS JOIN (VALUES ('birthday', 'tpl-classic', 1), ('birthday', 'tpl-minimal', 2)) AS v(cat, tcode, ord)
   JOIN templates t ON t.code = v.tcode
   WHERE c.code = v.cat
   ON CONFLICT (category_id, template_id) DO UPDATE SET sort_order = EXCLUDED.sort_order`,

  // Yildonumu: sadece C
  `INSERT INTO category_templates (category_id, template_id, sort_order)
   SELECT c.id, t.id, 1
   FROM page_categories c
   JOIN templates t ON t.code = 'tpl-minimal'
   WHERE c.code = 'anniversary'
   ON CONFLICT (category_id, template_id) DO UPDATE SET sort_order = EXCLUDED.sort_order`,

  // wedding-basic kullanan tum sayfalar -> tpl-gallery (FK sonra silinebilsin)
  `UPDATE special_pages sp
   SET template_id = tg.id
   FROM templates tg
   WHERE tg.code = 'tpl-gallery'
     AND sp.template_id IN (SELECT id FROM templates WHERE code = 'wedding-basic')`,

  `DELETE FROM templates WHERE code = 'wedding-basic'`,
];

export async function migrateCategoriesAndAssignments(pool: Pool): Promise<void> {
  for (let i = 0; i < STEPS.length; i++) {
    const sql = STEPS[i].trim();
    const preview = sql.replace(/\s+/g, " ").slice(0, 72);
    console.log(`[categories migrate ${i + 1}/${STEPS.length}] ${preview}...`);
    await pool.query(sql);
  }
  console.log("[categories migrate] tamam.");
}
