/** node-pg DatabaseError benzeri */
export function getPgUniqueConstraint(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const e = err as { code?: unknown; constraint?: unknown };
  if (e.code !== "23505") return undefined;
  return typeof e.constraint === "string" ? e.constraint : undefined;
}
