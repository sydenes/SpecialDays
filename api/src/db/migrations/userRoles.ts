import type { Pool } from "pg";
import { hashPassword } from "../../utils/password.js";

/**
 * users.role: user | admin
 * users.permissions: JSONB string[] — rol varsayılanlarına ek ince ayar
 */
export async function migrateUserRoles(pool: Pool): Promise<void> {
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
      CHECK (role IN ('user', 'admin'));
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb;
  `);

  await pool.query(`
    UPDATE users
    SET role = 'admin'
    WHERE email = 'test@example.com';
  `);

  const testHash = await hashPassword("test1234");
  await pool.query(`UPDATE users SET password_hash = $1 WHERE email = 'test@example.com'`, [testHash]);

  const adminDevHash = await hashPassword("admin123");
  const deleted = await pool.query(`DELETE FROM users WHERE LOWER(email) = LOWER($1)`, ["admin@test.com"]);
  await pool.query(
    `
    INSERT INTO users (full_name, email, password_hash, role, permissions, is_active)
    VALUES ('Dev Admin', 'admin@test.com', $1, 'admin', '[]'::jsonb, TRUE)
    `,
    [adminDevHash]
  );

  const recreated = (deleted.rowCount ?? 0) > 0 ? "onceki kayit silindi, " : "";
  console.log(
    `migrateUserRoles: ${recreated}admin@test.com/admin123 (admin) olusturuldu; test@example.com/test1234`
  );
}
