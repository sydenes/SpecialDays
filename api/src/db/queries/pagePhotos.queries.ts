import { pool } from "../pool.js";
import { mapPagePhotoRow, type PagePhoto } from "../../entities/pagePhotos.entity.js";

type PagePhotoRow = {
  id: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  sortOrder: number;
  createdAt: Date;
};

export async function getPagePhotosBySlug(slug: string): Promise<PagePhoto[]> {
  const { rows } = await pool.query(
    `
    SELECT
      p.id,
      p.file_url AS "fileUrl",
      p.thumbnail_url AS "thumbnailUrl",
      p.caption,
      p.sort_order AS "sortOrder",
      p.created_at AS "createdAt"
    FROM page_photos p
    JOIN special_pages sp ON sp.id = p.page_id
    WHERE sp.slug = $1
    ORDER BY p.sort_order ASC, p.created_at DESC
    `,
    [slug]
  );

  return (rows as PagePhotoRow[]).map((r) => mapPagePhotoRow(r));
}

