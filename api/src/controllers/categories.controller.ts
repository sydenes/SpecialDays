import type { NextFunction, Request, Response } from "express";
import {
  getTemplatesByCategoryCode,
  listPublicCategories,
} from "../db/queries/categories.queries.js";

function normalizeParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await listPublicCategories();
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
}

export async function listTemplatesForCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const code = normalizeParam(req.params.categoryCode);
    if (!code) return res.status(400).json({ error: "categoryCode is required" });

    const items = await getTemplatesByCategoryCode(code);
    if (items === null) return res.status(404).json({ error: "Category not found" });

    return res.json({ categoryCode: code, items });
  } catch (err) {
    return next(err);
  }
}
