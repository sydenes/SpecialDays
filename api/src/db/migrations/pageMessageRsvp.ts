import type { Pool } from "pg";

/** Misafir defteri — katılım durumu (RSVP) */
export async function migratePageMessageRsvp(pool: Pool): Promise<void> {
  await pool.query(`
    ALTER TABLE page_messages
      ADD COLUMN IF NOT EXISTS attendance_status TEXT,
      ADD COLUMN IF NOT EXISTS guest_count INT,
      ADD COLUMN IF NOT EXISTS decline_reason TEXT
  `);

  await pool.query(`
    ALTER TABLE page_messages
      DROP CONSTRAINT IF EXISTS page_messages_attendance_status_chk
  `);

  await pool.query(`
    ALTER TABLE page_messages
      ADD CONSTRAINT page_messages_attendance_status_chk
      CHECK (
        attendance_status IS NULL
        OR attendance_status IN ('attending', 'not_attending', 'undecided')
      )
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'page_messages_guest_count_chk'
      ) THEN
        ALTER TABLE page_messages
          ADD CONSTRAINT page_messages_guest_count_chk
          CHECK (guest_count IS NULL OR guest_count >= 1);
      END IF;
    END $$
  `);

  console.log("migratePageMessageRsvp: attendance_status, guest_count, decline_reason ready");
}
