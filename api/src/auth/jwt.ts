import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthUser, JwtPayload } from "./types.js";

const signOptions: SignOptions = {
  expiresIn: (env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
};

export function signAccessToken(user: AuthUser): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, env.JWT_SECRET, signOptions);
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!decoded || typeof decoded !== "object") return null;
    const p = decoded as JwtPayload;
    if (typeof p.sub !== "string" || typeof p.email !== "string") return null;
    if (p.role !== "user" && p.role !== "admin") return null;
    return p;
  } catch {
    return null;
  }
}
