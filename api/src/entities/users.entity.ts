export const usersEntity = {
  table: "users",
  columns: ["id", "full_name", "email", "password_hash", "role", "permissions", "is_active", "created_at", "updated_at"],
} as const;

