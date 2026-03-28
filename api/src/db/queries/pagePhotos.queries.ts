import { pool } from "../pool.js";
import { mapPagePhotoRow, type PagePhoto } from "../../entities/pagePhotos.entity.js";

export type PagePhotoDbRow = {
  id: string;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
  sortOrder: number;
  createdAt: Date;
  hasInline: boolean;
};

/** Public liste: BYTEA cekilmez, sadece hasInline */
export async function getPagePhotosBySlug(slug: string): Promise<PagePhoto[]> {
  const { rows } = await pool.query(
    `
    SELECT
      p.id,
      p.file_url AS "fileUrl",
      p.thumbnail_url AS "thumbnailUrl",
      p.caption,
      p.sort_order AS "sortOrder",
      p.created_at AS "createdAt",
      (p.image_data IS NOT NULL) AS "hasInline"
    FROM page_photos p
    JOIN special_pages sp ON sp.id = p.page_id
    WHERE sp.slug = $1
    ORDER BY p.sort_order ASC, p.created_at ASC
    `,
    [slug]
  );

  return (rows as PagePhotoDbRow[]).map((r) => mapPagePhotoRowForSlug(slug, r));
}

export function mapPagePhotoRowForSlug(slug: string, row: PagePhotoDbRow): PagePhoto {
  const inlinePath = `/api/pages/${slug}/photos/${row.id}/image`;
  return mapPagePhotoRow({
    id: row.id,
    fileUrl: row.hasInline ? inlinePath : row.fileUrl ?? "",
    thumbnailUrl: row.hasInline ? inlinePath : row.thumbnailUrl,
    caption: row.caption,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
  });
}

export type PagePhotoBlobRow = {
  imageData: Buffer | null;
  mimeType: string | null;
  fileUrl: string | null;
};

export async function getPagePhotoBlobBySlug(slug: string, photoId: string): Promise<PagePhotoBlobRow | null> {
  const { rows } = await pool.query(
    `
    SELECT
      p.image_data AS "imageData",
      p.mime_type AS "mimeType",
      p.file_url AS "fileUrl"
    FROM page_photos p
    JOIN special_pages sp ON sp.id = p.page_id
    WHERE sp.slug = $1 AND p.id = $2
    `,
    [slug, photoId]
  );
  if (rows.length === 0) return null;
  return rows[0] as PagePhotoBlobRow;
}

export async function countPhotosForPage(pageId: string): Promise<number> {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM page_photos WHERE page_id = $1`, [pageId]);
  return (rows[0] as { c: number }).c;
}

export async function insertInlinePagePhoto(
  pageId: string,
  imageData: Buffer,
  mimeType: string
): Promise<{ id: string; sortOrder: number }> {
  const { rows } = await pool.query(
    `
    INSERT INTO page_photos (page_id, file_url, thumbnail_url, caption, sort_order, image_data, mime_type)
    SELECT
      $1,
      NULL,
      NULL,
      NULL,
      (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM page_photos WHERE page_id = $1),
      $2,
      $3
    RETURNING id, sort_order AS "sortOrder"
    `,
    [pageId, imageData, mimeType]
  );
  return rows[0] as { id: string; sortOrder: number };
}

export async function deletePagePhoto(pageId: string, photoId: string): Promise<boolean> {
  const { rowCount } = await pool.query(`DELETE FROM page_photos WHERE page_id = $1 AND id = $2`, [
    pageId,
    photoId,
  ]);
  return (rowCount ?? 0) > 0;
}

export type PagePhotoContentRow = {
  id: string;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
  sortOrder: number;
  createdAt: Date;
  hasInline: boolean;
};

/** Dashboard icerik: slug ile goruntuleme URL cozumlemesi */
export async function getPageTemplatePhotoLimit(pageId: string): Promise<number | null> {
  const { rows } = await pool.query(
    `
    SELECT (t.config_schema->'contentRules'->>'maxPhotos')::int AS "max"
    FROM special_pages sp
    JOIN templates t ON t.id = sp.template_id
    WHERE sp.id = $1
    `,
    [pageId]
  );
  const m = (rows[0] as { max: number | null } | undefined)?.max;
  return typeof m === "number" && !Number.isNaN(m) ? m : null;
}

export async function getPagePhotosForPageId(pageId: string, slug: string): Promise<PagePhoto[]> {
  const { rows } = await pool.query(
    `
    SELECT
      p.id,
      p.file_url AS "fileUrl",
      p.thumbnail_url AS "thumbnailUrl",
      p.caption,
      p.sort_order AS "sortOrder",
      p.created_at AS "createdAt",
      (p.image_data IS NOT NULL) AS "hasInline"
    FROM page_photos p
    WHERE p.page_id = $1
    ORDER BY p.sort_order ASC, p.created_at ASC
    `,
    [pageId]
  );

  return (rows as PagePhotoContentRow[]).map((r) =>
    mapPagePhotoRowForSlug(slug, {
      id: r.id,
      fileUrl: r.fileUrl,
      thumbnailUrl: r.thumbnailUrl,
      caption: r.caption,
      sortOrder: r.sortOrder,
      createdAt: r.createdAt,
      hasInline: r.hasInline,
    })
  );
}
