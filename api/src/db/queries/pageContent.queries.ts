import { pool } from "../pool.js";
import { getPagePhotosForPageId } from "./pagePhotos.queries.js";

export type PageContentPhotoInput = {
  fileUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  sortOrder?: number;
};

export type PageContentTextInput = {
  blockKey: string;
  content: string;
  sortOrder?: number;
};

/** photos / texts undefined ise ilgili tabloya dokunulmaz (inline yuklemeler korunur) */
export type UpsertPageContentInput = {
  photos?: PageContentPhotoInput[] | null;
  texts?: PageContentTextInput[] | null;
  themeColor?: string | null;
  musicUrl?: string | null;
};

type TemplateRuleConfig = {
  contentRules?: {
    maxPhotos?: number;
    maxTexts?: number;
  };
};

export async function upsertPageContentByPageId(pageId: string, input: UpsertPageContentInput) {
  const { photos, texts, themeColor = null, musicUrl = null } = input;

  const pageInfoRes = await pool.query(
    `
    SELECT
      sp.id,
      sp.settings,
      t.config_schema AS "configSchema"
    FROM special_pages sp
    JOIN templates t ON t.id = sp.template_id
    WHERE sp.id = $1
    `,
    [pageId]
  );

  if (pageInfoRes.rows.length === 0) {
    throw new Error("Page not found");
  }

  const pageInfo = pageInfoRes.rows[0] as {
    id: string;
    settings: Record<string, unknown> | null;
    configSchema: TemplateRuleConfig | null;
  };

  const maxPhotosRaw = pageInfo.configSchema?.contentRules?.maxPhotos;
  const maxTextsRaw = pageInfo.configSchema?.contentRules?.maxTexts;
  const maxPhotos =
    typeof maxPhotosRaw === "number"
      ? maxPhotosRaw
      : typeof maxPhotosRaw === "string"
        ? parseInt(maxPhotosRaw, 10)
        : undefined;
  const maxTexts =
    typeof maxTextsRaw === "number"
      ? maxTextsRaw
      : typeof maxTextsRaw === "string"
        ? parseInt(maxTextsRaw, 10)
        : undefined;

  if (photos != null) {
    if (typeof maxPhotos === "number" && !Number.isNaN(maxPhotos) && photos.length > maxPhotos) {
      throw new Error(`Bu şablonda en fazla ${maxPhotos} fotoğraf kullanabilirsiniz.`);
    }
  }

  if (texts != null) {
    if (typeof maxTexts === "number" && !Number.isNaN(maxTexts) && texts.length > maxTexts) {
      throw new Error(`Bu şablonda en fazla ${maxTexts} metin bloğu kullanılabilir.`);
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (photos != null) {
      await client.query(`DELETE FROM page_photos WHERE page_id = $1`, [pageId]);
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        await client.query(
          `
          INSERT INTO page_photos (page_id, file_url, thumbnail_url, caption, sort_order)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [pageId, p.fileUrl, p.thumbnailUrl ?? null, p.caption ?? null, p.sortOrder ?? i + 1]
        );
      }
    }

    if (texts != null) {
      await client.query(`DELETE FROM page_text_blocks WHERE page_id = $1`, [pageId]);
      for (let i = 0; i < texts.length; i++) {
        const t = texts[i];
        await client.query(
          `
          INSERT INTO page_text_blocks (page_id, block_key, content, sort_order)
          VALUES ($1, $2, $3, $4)
          `,
          [pageId, t.blockKey, t.content, t.sortOrder ?? i + 1]
        );
      }
    }

    const mergedSettings = {
      ...(pageInfo.settings ?? {}),
      ...(themeColor ? { themeColor } : {}),
      ...(musicUrl ? { musicUrl } : {}),
    };

    await client.query(`UPDATE special_pages SET settings = $1::jsonb WHERE id = $2`, [
      JSON.stringify(mergedSettings),
      pageId,
    ]);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getPageContentByPageId(pageId: string) {
  const pageRes = await pool.query(
    `
    SELECT
      sp.id,
      sp.slug,
      sp.settings
    FROM special_pages sp
    WHERE sp.id = $1
    `,
    [pageId]
  );
  if (pageRes.rows.length === 0) return null;

  const pageRow = pageRes.rows[0] as { id: string; slug: string; settings: Record<string, unknown> };
  const photos = await getPagePhotosForPageId(pageId, pageRow.slug);

  const textsRes = await pool.query(
    `
    SELECT
      id,
      block_key AS "blockKey",
      content,
      sort_order AS "sortOrder",
      created_at AS "createdAt"
    FROM page_text_blocks
    WHERE page_id = $1
    ORDER BY sort_order ASC, created_at ASC
    `,
    [pageId]
  );

  return {
    page: pageRow,
    photos,
    texts: textsRes.rows,
  };
}
