import { pool } from "../pool.js";
import { mapSpecialPageRow, specialPagesEntity, type SpecialPage } from "../../entities/specialPage.entity.js";

export async function getSpecialPageBySlug(slug: string): Promise<SpecialPage | null> {
  const { rows } = await pool.query(
    `${specialPagesEntity.selectBySlug} WHERE sp.slug = $1`,
    [slug]
  );

  if (rows.length === 0) return null;

  return mapSpecialPageRow(rows[0] as Parameters<typeof mapSpecialPageRow>[0]);
}

