import type { Pool } from "pg";

/**
 * page_photos: BYTEA ile tarayicidan yukleme.
 * Her ifade ayri pool.query ile calisir (tek stringde coklu ALTER bazen yurutulmez).
 */
const STEPS: string[] = [
  `ALTER TABLE page_photos ADD COLUMN IF NOT EXISTS image_data BYTEA`,
  `ALTER TABLE page_photos ADD COLUMN IF NOT EXISTS mime_type TEXT`,
  `ALTER TABLE page_photos ADD COLUMN IF NOT EXISTS thumbnail_data BYTEA`,
  `ALTER TABLE page_photos ALTER COLUMN file_url DROP NOT NULL`,
  `ALTER TABLE page_photos DROP CONSTRAINT IF EXISTS page_photos_storage_chk`,
  `ALTER TABLE page_photos ADD CONSTRAINT page_photos_storage_chk CHECK (file_url IS NOT NULL OR image_data IS NOT NULL)`,
];

export async function migratePagePhotosInline(pool: Pool): Promise<void> {
  for (let i = 0; i < STEPS.length; i++) {
    const sql = STEPS[i];
    const preview = sql.replace(/\s+/g, " ").slice(0, 72);
    console.log(`[page_photos migrate ${i + 1}/${STEPS.length}] ${preview}...`);
    await pool.query(sql);
  }
  console.log("[page_photos migrate] tamam.");
}
