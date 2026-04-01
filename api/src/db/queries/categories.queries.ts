import { pool } from "../pool.js";
import { mapTemplateRow, type Template } from "../../entities/templates.entity.js";

export type PageCategory = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

function mapCategoryRow(row: {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
}): PageCategory {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    sortOrder: row.sortOrder,
  };
}

/** En az bir aktif sablonu olan aktif kategoriler */
export async function listPublicCategories(): Promise<PageCategory[]> {
  const { rows } = await pool.query(
    `
    SELECT
      c.id,
      c.code,
      c.name,
      c.description,
      c.sort_order AS "sortOrder"
    FROM page_categories c
    WHERE c.is_active = TRUE
      AND EXISTS (
        SELECT 1
        FROM category_templates ct
        INNER JOIN templates t ON t.id = ct.template_id AND t.is_active = TRUE
        WHERE ct.category_id = c.id
      )
    ORDER BY c.sort_order ASC, c.name ASC
    `
  );

  return (rows as any[]).map((r) => mapCategoryRow(r));
}

export async function categoryExistsPublic(code: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM page_categories WHERE code = $1 AND is_active = TRUE LIMIT 1`,
    [code]
  );
  return rows.length > 0;
}

/** Kategori yoksa null; varsa (bos olsa bile) sablon listesi */
export async function getTemplatesByCategoryCode(categoryCode: string): Promise<Template[] | null> {
  const exists = await categoryExistsPublic(categoryCode);
  if (!exists) return null;

  const { rows } = await pool.query(
    `
    SELECT
      t.id,
      t.code,
      t.name,
      t.category,
      t.preview_image_url,
      t.config_schema,
      t.is_active,
      t.created_at,
      t.updated_at
    FROM templates t
    INNER JOIN category_templates ct ON ct.template_id = t.id
    INNER JOIN page_categories c ON c.id = ct.category_id
    WHERE c.code = $1 AND c.is_active = TRUE AND t.is_active = TRUE
    ORDER BY ct.sort_order ASC, t.name ASC
    `,
    [categoryCode]
  );

  return (rows as any[]).map((r) => mapTemplateRow(r));
}
