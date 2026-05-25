import type { Pool } from "pg";

/** Taslak önizleme: slug + gizli token (auth gelene kadar sahip kanıtı) */
export async function migratePageDraftPreview(pool: Pool): Promise<void> {
  await pool.query(`
    ALTER TABLE special_pages
    ADD COLUMN IF NOT EXISTS preview_token TEXT
  `);

  await pool.query(`
    UPDATE special_pages
    SET preview_token = encode(gen_random_bytes(24), 'hex')
    WHERE preview_token IS NULL OR preview_token = ''
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_special_pages_preview_token
    ON special_pages (preview_token)
    WHERE preview_token IS NOT NULL
  `);

  console.log("[pageDraftPreview] tamam.");
}
