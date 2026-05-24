import type { Pool } from "pg";
import { migrateTrimTemplateCatalog } from "./trimTemplateCatalog.js";

/** Temel 3 sablonu gunceller; sadece Beauty premium sablonunu ekler; katalogu sadelestirir */
export async function migrateTemplateVariants(pool: Pool): Promise<void> {
  const baseOptional = { themeColor: true, musicUrl: true };

  const tplClassic = {
    layout: "stacked",
    visualTheme: "default",
    sections: ["music", "hero", "intro", "fullBleedHero", "countdown", "stackCards", "photoStrip", "guestbook"],
    contentRules: { maxPhotos: 10, maxTexts: 2 },
    textBlocks: [
      { key: "welcome", label: "Karşılama" },
      { key: "details", label: "Detaylar" },
    ],
    optionalSettings: baseOptional,
    components: { countdown: true, guestbook: true },
  };

  const tplGallery = {
    layout: "split-hero",
    visualTheme: "elegant",
    sections: ["music", "hero", "intro", "countdown", "splitContent", "guestbook"],
    contentRules: { maxPhotos: 10, maxTexts: 3, heroPoolMax: 6 },
    textBlocks: [
      { key: "intro", label: "Giriş metni" },
      { key: "story", label: "Hikaye" },
      { key: "footer", label: "Alt bilgi" },
    ],
    optionalSettings: baseOptional,
    components: { countdown: true, guestbook: true },
  };

  const tplMinimal = {
    layout: "minimal",
    visualTheme: "minimal-clean",
    sections: ["music", "hero", "intro", "countdown", "minimalBlock", "saveTheDate", "guestbook"],
    contentRules: { maxPhotos: 10, maxTexts: 3, heroPoolMax: 6 },
    textBlocks: [{ key: "message", label: "Mesajınız" }],
    optionalSettings: baseOptional,
    components: { countdown: true, guestbook: true },
    sectionOptions: { saveTheDate: { label: "Takvime ekle" } },
  };

  for (const [code, schema] of [
    ["tpl-classic", tplClassic],
    ["tpl-gallery", tplGallery],
    ["tpl-minimal", tplMinimal],
  ] as const) {
    await pool.query(`UPDATE templates SET config_schema = $1::jsonb WHERE code = $2`, [JSON.stringify(schema), code]);
  }

  /** TemplateMo 519 Beauty — özel React/CSS uyarlaması */
  const tplBeauty = {
    layout: "beauty",
    visualTheme: "beauty-templatemo",
    sections: ["beauty"],
    contentRules: { maxPhotos: 12, maxTexts: 4 },
    textBlocks: [
      { key: "intro", label: "Karşılama alt başlığı" },
      { key: "story", label: "Hikâye (sağ panel): başlık + boş satır + paragraflar" },
      { key: "details", label: "Detaylar: isteğe alt başlık için çift boş satır" },
      { key: "footer", label: "Galeri üstü orta metin" },
    ],
    optionalSettings: baseOptional,
    components: { countdown: true, guestbook: true },
  };

  await pool.query(
    `
    INSERT INTO templates (code, name, category, preview_image_url, config_schema, is_active)
    VALUES ($1, $2, 'shared', NULL, $3::jsonb, TRUE)
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      category = EXCLUDED.category,
      config_schema = EXCLUDED.config_schema,
      is_active = EXCLUDED.is_active
    `,
    ["tpl-beauty", "Beauty · Premium davet", JSON.stringify(tplBeauty)]
  );

  await migrateTrimTemplateCatalog(pool);

  // Eski şema kayıtlarında kalan düşük maxPhotos değerlerini yükselt
  await pool.query(`
    UPDATE templates
    SET config_schema = jsonb_set(
      config_schema,
      '{contentRules,maxPhotos}',
      to_jsonb(GREATEST(COALESCE((config_schema->'contentRules'->>'maxPhotos')::int, 0), 10)),
      true
    )
    WHERE code <> 'tpl-beauty'
      AND COALESCE((config_schema->'contentRules'->>'maxPhotos')::int, 0) < 10
  `);

  console.log("[templateVariants] tamam.");
}
