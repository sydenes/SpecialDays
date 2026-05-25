import type { Pool } from "pg";

export async function migratePageSoftDelete(pool: Pool): Promise<void> {
  await pool.query(`
    ALTER TABLE special_pages
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_special_pages_deleted_at
    ON special_pages(deleted_at)
    WHERE deleted_at IS NOT NULL;
  `);
  console.log("migratePageSoftDelete: deleted_at column ready");
}
