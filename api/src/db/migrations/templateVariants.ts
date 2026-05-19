import type { Pool } from "pg";

/** sections + yeni layout / tema varyantlari; mevcut 3 sablonu gunceller, 7 yeni ekler */
export async function migrateTemplateVariants(pool: Pool): Promise<void> {
  const baseOptional = { themeColor: true, musicUrl: true };

  const tplClassic = {
    layout: "stacked",
    visualTheme: "default",
    sections: ["music", "hero", "intro", "fullBleedHero", "countdown", "stackCards", "photoStrip", "guestbook"],
    contentRules: { maxPhotos: 5, maxTexts: 2 },
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
    contentRules: { maxPhotos: 10, maxTexts: 3 },
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
    contentRules: { maxPhotos: 3, maxTexts: 1 },
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

  const weddingMagazine = {
    layout: "magazine",
    visualTheme: "wedding-gold",
    sections: ["music", "hero", "intro", "countdown", "magazine"],
    contentRules: { maxPhotos: 12, maxTexts: 4 },
    textBlocks: [
      { key: "intro", label: "Giriş" },
      { key: "story", label: "Hikayemiz" },
      { key: "details", label: "Düğün detayları" },
      { key: "footer", label: "Not" },
    ],
    optionalSettings: baseOptional,
    components: { countdown: true, guestbook: true },
    sectionOptions: { magazine: { guestbookInSidebar: true } },
  };

  const weddingTimeline = {
    layout: "timeline",
    visualTheme: "wedding-gold",
    sections: ["music", "hero", "intro", "countdown", "timeline", "guestbook"],
    contentRules: { maxPhotos: 10, maxTexts: 4 },
    textBlocks: [
      { key: "intro", label: "Tanışmamız" },
      { key: "story", label: "Birlikte" },
      { key: "details", label: "Evlilik" },
      { key: "footer", label: "Davet" },
    ],
    optionalSettings: baseOptional,
    components: { countdown: true, guestbook: true },
  };

  const birthdayParty = {
    layout: "party",
    visualTheme: "party-neon",
    sections: ["music", "hero", "intro", "fullBleedHero", "countdown", "partyStack", "guestbook"],
    contentRules: { maxPhotos: 12, maxTexts: 3 },
    textBlocks: [
      { key: "welcome", label: "Parti mesajı" },
      { key: "details", label: "Detaylar" },
      { key: "fun", label: "Sürpriz not" },
    ],
    optionalSettings: baseOptional,
    components: { countdown: true, guestbook: true },
  };

  const birthdayScrapbook = {
    layout: "scrapbook",
    visualTheme: "scrapbook",
    sections: ["music", "hero", "intro", "countdown", "scrapbook", "guestbook"],
    contentRules: { maxPhotos: 10, maxTexts: 4 },
    textBlocks: [
      { key: "welcome", label: "En güzel anlar" },
      { key: "details", label: "Komik anılar" },
      { key: "story", label: "Mesajlarınız" },
      { key: "footer", label: "Not" },
    ],
    optionalSettings: baseOptional,
    components: { countdown: true, guestbook: true },
  };

  const anniversaryJourney = {
    layout: "journey",
    visualTheme: "romantic-burgundy",
    sections: ["music", "hero", "intro", "fullBleedHero", "countdown", "journey", "guestbook"],
    contentRules: { maxPhotos: 10, maxTexts: 4 },
    textBlocks: [
      { key: "intro", label: "Birlikte" },
      { key: "story", label: "En güzel anılar" },
      { key: "details", label: "Sevgi notları" },
      { key: "footer", label: "Gelecek" },
    ],
    optionalSettings: baseOptional,
    components: { countdown: true, guestbook: true },
  };

  const anniversaryLetter = {
    layout: "letter",
    visualTheme: "letter-parchment",
    sections: ["music", "hero", "intro", "countdown", "letter", "guestbook"],
    contentRules: { maxPhotos: 6, maxTexts: 3 },
    textBlocks: [
      { key: "intro", label: "Sevgili," },
      { key: "story", label: "Mektup gövdesi" },
      { key: "footer", label: "İmza" },
    ],
    optionalSettings: baseOptional,
    components: { countdown: true, guestbook: true },
  };

  const anniversarySplit = {
    layout: "split-scroll",
    visualTheme: "romantic-burgundy",
    sections: ["music", "hero", "intro", "countdown", "splitScroll", "guestbook"],
    contentRules: { maxPhotos: 8, maxTexts: 4 },
    textBlocks: [
      { key: "intro", label: "Sol başlık" },
      { key: "story", label: "Anılar" },
      { key: "details", label: "Daha fazlası" },
      { key: "footer", label: "Kapanış" },
    ],
    optionalSettings: baseOptional,
    components: { countdown: true, guestbook: true },
  };

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

  const inserts: [string, string, Record<string, unknown>][] = [
    ["tpl-wedding-magazine", "Düğün · Dergi & yan sütun", weddingMagazine],
    ["tpl-wedding-timeline", "Düğün · Zaman çizelgesi", weddingTimeline],
    ["tpl-birthday-party", "Doğum günü · Parti modu", birthdayParty],
    ["tpl-birthday-scrapbook", "Doğum günü · Anı defteri", birthdayScrapbook],
    ["tpl-anniversary-journey", "Yıldönümü · Yolculuk", anniversaryJourney],
    ["tpl-anniversary-letter", "Yıldönümü · Mektup", anniversaryLetter],
    ["tpl-anniversary-split", "Yıldönümü · Bölünmüş anılar", anniversarySplit],
    ["tpl-beauty", "Beauty · TemplateMo (premium düzen)", tplBeauty],
  ];

  for (const [code, name, schema] of inserts) {
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
      [code, name, JSON.stringify(schema)]
    );
  }

  const categoryRows: [string, string, number][] = [
    ["wedding", "tpl-wedding-magazine", 3],
    ["wedding", "tpl-wedding-timeline", 4],
    ["birthday", "tpl-birthday-party", 3],
    ["birthday", "tpl-birthday-scrapbook", 4],
    ["anniversary", "tpl-anniversary-journey", 2],
    ["anniversary", "tpl-anniversary-letter", 3],
    ["anniversary", "tpl-anniversary-split", 4],
    ["wedding", "tpl-beauty", 5],
    ["birthday", "tpl-beauty", 5],
    ["anniversary", "tpl-beauty", 5],
  ];

  for (const [cat, tcode, ord] of categoryRows) {
    await pool.query(
      `
      INSERT INTO category_templates (category_id, template_id, sort_order)
      SELECT c.id, t.id, $3
      FROM page_categories c
      JOIN templates t ON t.code = $2
      WHERE c.code = $1
      ON CONFLICT (category_id, template_id) DO UPDATE SET sort_order = EXCLUDED.sort_order
      `,
      [cat, tcode, ord]
    );
  }

  console.log("[templateVariants] tamam.");
}
