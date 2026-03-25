import { createHash } from "crypto";

export function hashPassword(plain: string): string {
  // MVP icin basit hash. Istersen ileride bcrypt/argon2'a geciririz.
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

