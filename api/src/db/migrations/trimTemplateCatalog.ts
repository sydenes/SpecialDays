import type { Pool } from "pg";

/** Kategori başına gösterilecek şablonlar (sıra = picker sırası) */
export const TEMPLATES_PER_CATEGORY: Record<string, string[]> = {
  wedding: ["tpl-gallery", "tpl-beauty"],
  birthday: ["tpl-classic", "tpl-beauty"],
  anniversary: ["tpl-minimal", "tpl-beauty"],
};

/** Kaldırılan şablonlardaki sayfaların taşınacağı hedef */
const REASSIGN_TEMPLATE: Record<string, string> = {
  "tpl-wedding-magazine": "tpl-gallery",
  "tpl-wedding-timeline": "tpl-gallery",
  "tpl-birthday-party": "tpl-classic",
  "tpl-birthday-scrapbook": "tpl-classic",
  "tpl-anniversary-journey": "tpl-minimal",
  "tpl-anniversary-letter": "tpl-minimal",
  "tpl-anniversary-split": "tpl-minimal",
};

const REMOVE_TEMPLATE_CODES = [
  "tpl-wedding-magazine",
  "tpl-wedding-timeline",
  "tpl-birthday-party",
  "tpl-birthday-scrapbook",
  "tpl-anniversary-journey",
  "tpl-anniversary-letter",
  "tpl-anniversary-split",
];

/**
 * Kategori–şablon ilişkisini sadeleştirir; kullanılmayan varyant şablonlarını siler.
 */
export async function migrateTrimTemplateCatalog(pool: Pool): Promise<void> {
  for (const [fromCode, toCode] of Object.entries(REASSIGN_TEMPLATE)) {
    await pool.query(
      `
      UPDATE special_pages sp
      SET template_id = tgt.id
      FROM templates src
      JOIN templates tgt ON tgt.code = $2
      WHERE sp.template_id = src.id
        AND src.code = $1
      `,
      [fromCode, toCode]
    );
  }

  for (const [categoryCode, templateCodes] of Object.entries(TEMPLATES_PER_CATEGORY)) {
    await pool.query(
      `
      DELETE FROM category_templates
      WHERE category_id = (SELECT id FROM page_categories WHERE code = $1)
      `,
      [categoryCode]
    );

    for (let i = 0; i < templateCodes.length; i++) {
      await pool.query(
        `
        INSERT INTO category_templates (category_id, template_id, sort_order)
        SELECT c.id, t.id, $3
        FROM page_categories c
        JOIN templates t ON t.code = $2
        WHERE c.code = $1
        ON CONFLICT (category_id, template_id) DO UPDATE SET sort_order = EXCLUDED.sort_order
        `,
        [categoryCode, templateCodes[i], i + 1]
      );
    }
  }

  await pool.query(
    `
    UPDATE templates
    SET is_active = FALSE
    WHERE code = ANY($1::text[])
    `,
    [REMOVE_TEMPLATE_CODES]
  );

  await pool.query(
    `
    DELETE FROM templates t
    WHERE t.code = ANY($1::text[])
      AND NOT EXISTS (SELECT 1 FROM special_pages sp WHERE sp.template_id = t.id)
    `,
    [REMOVE_TEMPLATE_CODES]
  );

  console.log("[trimTemplateCatalog] tamam.");
}
