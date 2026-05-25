import type { AuthUser, UserRole } from "./types.js";

/** Rol bazlı varsayılan izinler */
export const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
  user: ["pages:own:read", "pages:own:write", "pages:own:delete"],
  admin: [
    "pages:own:read",
    "pages:own:write",
    "pages:own:delete",
    "pages:all:read",
    "pages:all:write",
    "pages:all:delete",
    "templates:manage",
    "dashboard:access",
  ],
};

export function effectivePermissions(user: AuthUser): Set<string> {
  const base = new Set<string>(ROLE_PERMISSIONS[user.role] ?? []);
  for (const p of user.permissions) {
    if (typeof p === "string" && p.trim()) base.add(p.trim());
  }
  return base;
}

export function hasPermission(user: AuthUser, permission: string): boolean {
  return effectivePermissions(user).has(permission);
}

export function isAdmin(user: AuthUser): boolean {
  return user.role === "admin";
}

export function canManagePage(user: AuthUser, ownerUserId: string): boolean {
  if (isAdmin(user)) return true;
  return user.id === ownerUserId;
}
