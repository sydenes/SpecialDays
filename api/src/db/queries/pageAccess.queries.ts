import { pool } from "../pool.js";

export type PageAccessContext = {
  pageId: string;
  slug: string;
  status: "draft" | "published" | "archived";
};

/** Herkese açık sayfa — yalnızca published */
export async function getPublishedPageAccess(slug: string): Promise<PageAccessContext | null> {
  const { rows } = await pool.query(
    `
    SELECT sp.id, sp.slug, sp.status
    FROM special_pages sp
    WHERE sp.slug = $1 AND sp.status = 'published' AND sp.deleted_at IS NULL
    `,
    [slug]
  );
  if (rows.length === 0) return null;
  const r = rows[0] as { id: string; slug: string; status: PageAccessContext["status"] };
  return { pageId: r.id, slug: r.slug, status: r.status };
}

/**
 * Taslak önizleme — slug + preview_token eşleşmeli, sayfa draft olmalı.
 * Token URL'de olduğu sürece sahibe özel önizleme (auth gelince oturum ile değişecek).
 */
export async function getDraftPreviewAccess(slug: string, previewToken: string): Promise<PageAccessContext | null> {
  if (!previewToken.trim()) return null;
  const { rows } = await pool.query(
    `
    SELECT sp.id, sp.slug, sp.status
    FROM special_pages sp
    WHERE sp.slug = $1
      AND sp.preview_token = $2
      AND sp.status = 'draft'
    `,
    [slug, previewToken.trim()]
  );
  if (rows.length === 0) return null;
  const r = rows[0] as { id: string; slug: string; status: PageAccessContext["status"] };
  return { pageId: r.id, slug: r.slug, status: r.status };
}

/** Oturum açmış sayfa sahibi — token olmadan taslak önizleme */
export async function getDraftPreviewByOwner(slug: string, ownerUserId: string): Promise<PageAccessContext | null> {
  const { rows } = await pool.query(
    `
    SELECT sp.id, sp.slug, sp.status
    FROM special_pages sp
    WHERE sp.slug = $1
      AND sp.owner_user_id = $2
      AND sp.status = 'draft'
    `,
    [slug, ownerUserId]
  );
  if (rows.length === 0) return null;
  const r = rows[0] as { id: string; slug: string; status: PageAccessContext["status"] };
  return { pageId: r.id, slug: r.slug, status: r.status };
}
