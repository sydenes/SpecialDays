import type { NextFunction, Response } from "express";
import {
  getDraftPreviewAccess,
  getDraftPreviewByOwner,
  type PageAccessContext,
} from "../db/queries/pageAccess.queries.js";
import {
  getPagePhotoBlobBySlugForDraft,
  getPagePhotosBySlugForDraft,
} from "../db/queries/pagePhotos.queries.js";
import { getTextBlocksBySlugForDraft } from "../db/queries/pageTextBlocks.queries.js";
import { getSpecialPageBySlugForPreview } from "../db/queries/specialPages.queries.js";
import type { AuthedRequest } from "../middleware/requireAuth.js";

function getQueryToken(req: AuthedRequest): string | null {
  const v = (req.query as { token?: string | string[] })?.token;
  if (typeof v === "string" && v.trim()) return v.trim();
  if (Array.isArray(v) && typeof v[0] === "string" && v[0].trim()) return v[0].trim();
  return null;
}

function normalizeSlug(req: AuthedRequest): string | null {
  const slugParam = req.params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  return slug?.trim() || null;
}

function draftAccessOpts(req: AuthedRequest) {
  const token = getQueryToken(req);
  return {
    previewToken: token || undefined,
    ownerUserId: !token && req.authUser ? req.authUser.id : undefined,
  };
}

async function resolveDraftAccess(req: AuthedRequest, slug: string): Promise<PageAccessContext | null> {
  const token = getQueryToken(req);
  if (token) return getDraftPreviewAccess(slug, token);
  if (req.authUser) return getDraftPreviewByOwner(slug, req.authUser.id);
  return null;
}

/** GET /api/preview/:slug?token=... veya oturum (sahip) */
export async function getPagePreview(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const slug = normalizeSlug(req);
    if (!slug) return res.status(400).json({ error: "slug required" });

    const access = await resolveDraftAccess(req, slug);
    if (!access) return res.status(404).json({ error: "Preview not found" });

    const page = await getSpecialPageBySlugForPreview(slug);
    if (!page) return res.status(404).json({ error: "Preview not found" });

    return res.json(page);
  } catch (err) {
    return next(err);
  }
}

export async function getPreviewPhotos(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const slug = normalizeSlug(req);
    if (!slug) return res.status(400).json({ error: "slug required" });

    const access = await resolveDraftAccess(req, slug);
    if (!access) return res.status(404).json({ error: "Preview not found" });

    const photos = await getPagePhotosBySlugForDraft(slug, draftAccessOpts(req));
    return res.json({ items: photos });
  } catch (err) {
    return next(err);
  }
}

export async function getPreviewTexts(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const slug = normalizeSlug(req);
    if (!slug) return res.status(400).json({ error: "slug required" });

    const access = await resolveDraftAccess(req, slug);
    if (!access) return res.status(404).json({ error: "Preview not found" });

    const items = await getTextBlocksBySlugForDraft(slug, draftAccessOpts(req));
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
}

export async function getPreviewPhotoImage(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const slug = normalizeSlug(req);
    const photoIdParam = req.params.photoId;
    const photoId = Array.isArray(photoIdParam) ? photoIdParam[0] : photoIdParam;
    if (!slug || !photoId) return res.status(400).json({ error: "slug and photoId required" });

    const access = await resolveDraftAccess(req, slug);
    if (!access) return res.status(404).end();

    const row = await getPagePhotoBlobBySlugForDraft(slug, photoId, draftAccessOpts(req));
    if (!row) return res.status(404).end();

    if (row.imageData && row.imageData.length > 0) {
      res.setHeader("Content-Type", row.mimeType || "application/octet-stream");
      res.setHeader("Cache-Control", "private, max-age=300");
      return res.send(row.imageData);
    }

    if (row.fileUrl && /^https?:\/\//i.test(row.fileUrl)) {
      return res.redirect(302, row.fileUrl);
    }

    return res.status(404).end();
  } catch (err) {
    return next(err);
  }
}
