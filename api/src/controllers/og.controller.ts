import type { NextFunction, Request, Response } from "express";
import { getPublishedPageOgMeta } from "../db/queries/pageOg.queries.js";
import { buildOgHtml, resolveOgMeta } from "../utils/ogHtml.js";

function normalizeSlug(req: Request): string | null {
  const slugParam = req.params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const s = slug?.trim().toLowerCase();
  return s || null;
}

/** GET /api/og/:slug — JSON (UI + debug) */
export async function getOgMetaJson(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = normalizeSlug(req);
    if (!slug) return res.status(400).json({ error: "slug required" });

    const meta = await getPublishedPageOgMeta(slug);
    if (!meta) return res.status(404).json({ error: "Page not found" });

    return res.json(resolveOgMeta(meta));
  } catch (err) {
    return next(err);
  }
}

/** GET /og-preview/:slug — WhatsApp/Facebook debugger için HTML önizleme */
export async function getOgPreviewHtml(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = normalizeSlug(req);
    if (!slug) return res.status(400).send("slug required");

    const meta = await getPublishedPageOgMeta(slug);
    if (!meta) return res.status(404).send("Page not found");

    const html = buildOgHtml(resolveOgMeta(meta));
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.send(html);
  } catch (err) {
    return next(err);
  }
}
