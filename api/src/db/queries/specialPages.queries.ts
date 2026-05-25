import { pool } from "../pool.js";
import { mapSpecialPageRow, specialPagesEntity, type SpecialPage } from "../../entities/specialPage.entity.js";

/** Yalnızca yayında olan sayfa (public site) */
export async function getSpecialPageBySlug(slug: string): Promise<SpecialPage | null> {
  const { rows } = await pool.query(
    `${specialPagesEntity.selectBySlug} WHERE sp.slug = $1 AND sp.status = 'published' AND sp.deleted_at IS NULL`,
    [slug]
  );

  if (rows.length === 0) return null;

  return mapSpecialPageRow(rows[0] as Parameters<typeof mapSpecialPageRow>[0]);
}

/** Taslak önizleme (token doğrulandıktan sonra) */
export async function getSpecialPageBySlugForPreview(slug: string): Promise<SpecialPage | null> {
  const { rows } = await pool.query(
    `${specialPagesEntity.selectBySlug} WHERE sp.slug = $1 AND sp.status = 'draft'`,
    [slug]
  );
  if (rows.length === 0) return null;
  return mapSpecialPageRow(rows[0] as Parameters<typeof mapSpecialPageRow>[0]);
}

