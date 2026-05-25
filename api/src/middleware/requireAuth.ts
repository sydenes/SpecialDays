import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../auth/jwt.js";
import type { AuthUser } from "../auth/types.js";
import { findUserById } from "../db/queries/users.queries.js";

export type AuthedRequest = Request & { authUser?: AuthUser };

function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || typeof header !== "string") return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const token = readBearerToken(req);
    if (!token) return res.status(401).json({ error: "Giris gerekli" });

    const payload = verifyAccessToken(token);
    if (!payload) return res.status(401).json({ error: "Oturum gecersiz veya suresi dolmus" });

    const user = await findUserById(payload.sub);
    if (!user || !user.isActive) return res.status(401).json({ error: "Hesap bulunamadi veya pasif" });

    req.authUser = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Opsiyonel oturum — token yoksa devam eder */
export async function optionalAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const token = readBearerToken(req);
    if (!token) return next();

    const payload = verifyAccessToken(token);
    if (!payload) return next();

    const user = await findUserById(payload.sub);
    if (user?.isActive) req.authUser = user;
    return next();
  } catch (err) {
    return next(err);
  }
}
