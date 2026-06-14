import { pool } from "../pool.js";

export type PageOgMeta = {
  slug: string;
  title: string;
  description: string;
  firstPhotoId: string | null;
  heroImageUrl: string | null;
};

function buildDescription(title: string, mainText: string | null, eventDate: Date | null): string {
  const text = (mainText || "").trim().replace(/\s+/g, " ");
  if (text) return text.length > 200 ? `${text.slice(0, 197)}…` : text;

  if (eventDate) {
    const d = eventDate.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return `${title} — ${d}. Özel gün sayfasına davetlisiniz.`;
  }

  return `${title} — Özel bir gün için hazırlanmış sayfa.`;
}

export async function getPublishedPageOgMeta(slug: string): Promise<PageOgMeta | null> {
  const { rows } = await pool.query(
    `
    SELECT
      sp.slug,
      sp.title,
      sp.main_text AS "mainText",
      sp.event_date AS "eventDate",
      sp.hero_image_url AS "heroImageUrl",
      (
        SELECT p.id
        FROM page_photos p
        WHERE p.page_id = sp.id
        ORDER BY p.sort_order ASC, p.created_at ASC
        LIMIT 1
      ) AS "firstPhotoId"
    FROM special_pages sp
    WHERE sp.slug = $1
      AND sp.status = 'published'
      AND sp.deleted_at IS NULL
    `,
    [slug]
  );

  if (rows.length === 0) return null;

  const r = rows[0] as {
    slug: string;
    title: string;
    mainText: string | null;
    eventDate: Date | null;
    heroImageUrl: string | null;
    firstPhotoId: string | null;
  };

  return {
    slug: r.slug,
    title: r.title.trim() || r.slug,
    description: buildDescription(r.title, r.mainText, r.eventDate),
    firstPhotoId: r.firstPhotoId,
    heroImageUrl: r.heroImageUrl,
  };
}
