import { pool } from "../pool.js";
import { mapSpecialPageRow, specialPagesEntity, type SpecialPage } from "../../entities/specialPage.entity.js";

export async function getSpecialPageBySlug(slug: string): Promise<SpecialPage | null> {
  const { rows } = await pool.query(
    `${specialPagesEntity.selectBySlug} WHERE slug = $1`,
    [slug]
  );

  if (rows.length === 0) return null;

  return mapSpecialPageRow(rows[0] as {
    slug: string;
    templateId: string;
    templateCode: string;
    templateName: string;
    templateCategory: string;
    title: string;
    eventDate: Date | null;
    mainText: string | null;
  });
}

