import type { NextFunction, Request, Response } from "express";
import { signAccessToken } from "../auth/jwt.js";
import { createUser, findUserByEmail } from "../db/queries/users.queries.js";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

function publicUser(user: { id: string; fullName: string; email: string; role: string }) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as Record<string, unknown>;
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!fullName || !email || password.length < 8) {
      return res.status(400).json({ error: "Ad, e-posta ve en az 8 karakterlik sifre gerekli" });
    }

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: "Bu e-posta zaten kayitli" });

    const passwordHash = await hashPassword(password);
    const user = await createUser({ fullName, email, passwordHash, role: "user" });
    const token = signAccessToken(user);

    return res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return res.status(400).json({ error: "E-posta ve sifre gerekli" });
    }

    const row = await findUserByEmail(email);
    if (!row || !row.isActive) {
      return res.status(401).json({ error: "E-posta veya sifre hatali" });
    }

    const ok = await verifyPassword(password, row.passwordHash);
    if (!ok) return res.status(401).json({ error: "E-posta veya sifre hatali" });

    const { passwordHash: _ph, ...user } = row;
    const token = signAccessToken(user);

    return res.json({ token, user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

export async function me(req: AuthedRequest, res: Response) {
  const user = req.authUser;
  if (!user) return res.status(401).json({ error: "Giris gerekli" });
  return res.json({ user: publicUser(user) });
}
