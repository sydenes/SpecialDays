import type { NextFunction, Response } from "express";
import { isAdmin } from "../auth/permissions.js";
import type { AuthedRequest } from "./requireAuth.js";

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const user = req.authUser;
  if (!user) return res.status(401).json({ error: "Giris gerekli" });
  if (!isAdmin(user)) return res.status(403).json({ error: "Bu islem icin yonetici yetkisi gerekli" });
  return next();
}
