import { pool } from "../pool.js";

export type PageTextBlock = {
  id: string;
  blockKey: string;
  content: string;
  sortOrder: number;
  createdAt: Date;
};

type PageTextBlockRow = {
  id: string;
  blockKey: string;
  content: string;
  sortOrder: number;
  createdAt: Date;
};

export async function getTextBlocksBySlug(slug: string): Promise<PageTextBlock[]> {
  const { rows } = await pool.query(
    `
    SELECT
      tb.id,
      tb.block_key AS "blockKey",
      tb.content,
      tb.sort_order AS "sortOrder",
      tb.created_at AS "createdAt"
    FROM page_text_blocks tb
    JOIN special_pages sp ON sp.id = tb.page_id
    WHERE sp.slug = $1
    ORDER BY tb.sort_order ASC, tb.created_at ASC
    `,
    [slug]
  );

  return rows as PageTextBlockRow[];
}

