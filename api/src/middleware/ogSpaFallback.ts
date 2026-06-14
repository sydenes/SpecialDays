import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { getPublishedPageOgMeta } from "../db/queries/pageOg.queries.js";
import { isSocialCrawler } from "../utils/crawler.js";
import { injectOgIntoIndexHtml, resolveOgMeta } from "../utils/ogHtml.js";

const RESERVED_SLUGS = new Set([
  "api",
  "health",
  "og-preview",
  "templates",
  "create",
  "edit",
  "dashboard",
  "published",
  "preview",
  "panom",
  "giris",
  "kayit",
]);

let cachedIndexHtml: string | null = null;

function getIndexHtml(): string | null {
  if (!env.UI_DIST_PATH) return null;
  const indexPath = join(env.UI_DIST_PATH, "index.html");
  if (!existsSync(indexPath)) return null;
  if (!cachedIndexHtml) cachedIndexHtml = readFileSync(indexPath, "utf8");
  return cachedIndexHtml;
}

/** Production: crawler isteklerinde slug sayfalarına OG enjekte edilmiş HTML döner */
export async function ogSpaFallback(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "GET") return next();
  if (!env.UI_DIST_PATH) return next();

  const slugRaw = req.params.slug;
  const slug = (Array.isArray(slugRaw) ? slugRaw[0] : slugRaw)?.trim().toLowerCase();
  if (!slug || RESERVED_SLUGS.has(slug) || slug.includes(".")) return next();
  if (!isSocialCrawler(req)) return next();

  try {
    const meta = await getPublishedPageOgMeta(slug);
    if (!meta) return next();

    const indexHtml = getIndexHtml();
    if (!indexHtml) return next();

    const html = injectOgIntoIndexHtml(indexHtml, resolveOgMeta(meta));
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.send(html);
  } catch {
    return next();
  }
}
