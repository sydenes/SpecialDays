import { pool } from "../pool.js";
import type { AuthUser, UserRole } from "../../auth/types.js";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  permissions: unknown;
  is_active: boolean;
};

function parsePermissions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is string => typeof p === "string" && p.trim().length > 0);
}

export function mapUserRow(row: UserRow): AuthUser {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role === "admin" ? "admin" : "user",
    permissions: parsePermissions(row.permissions),
    isActive: row.is_active,
  };
}

const USER_SELECT = `
  SELECT id, full_name, email, password_hash, role, permissions, is_active
  FROM users
`;

export async function findUserByEmail(email: string): Promise<(AuthUser & { passwordHash: string }) | null> {
  const { rows } = await pool.query(`${USER_SELECT} WHERE LOWER(email) = LOWER($1) LIMIT 1`, [
    email.trim(),
  ]);
  if (rows.length === 0) return null;
  const row = rows[0] as UserRow;
  return { ...mapUserRow(row), passwordHash: row.password_hash };
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  const { rows } = await pool.query(`${USER_SELECT} WHERE id = $1 LIMIT 1`, [id]);
  if (rows.length === 0) return null;
  return mapUserRow(rows[0] as UserRow);
}

export async function createUser(input: {
  fullName: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}): Promise<AuthUser> {
  const role = input.role === "admin" ? "admin" : "user";
  const { rows } = await pool.query(
    `
    INSERT INTO users (full_name, email, password_hash, role, permissions)
    VALUES ($1, $2, $3, $4, '[]'::jsonb)
    RETURNING id, full_name, email, password_hash, role, permissions, is_active
    `,
    [input.fullName.trim(), input.email.trim().toLowerCase(), input.passwordHash, role]
  );
  return mapUserRow(rows[0] as UserRow);
}
