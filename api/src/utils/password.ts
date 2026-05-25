import { createHash } from "crypto";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/** Eski SHA-256 seed şifreleri (initDb testhash) ile uyumluluk */
function legacySha256(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

export async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  if (storedHash.startsWith("$2")) {
    return bcrypt.compare(plain, storedHash);
  }
  return legacySha256(plain) === storedHash;
}
