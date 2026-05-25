import type { NextFunction, Request, Response } from "express";
import { getSpecialPageBySlug } from "../db/queries/specialPages.queries.js";
import { getPagePhotoBlobBySlug, getPagePhotosBySlug } from "../db/queries/pagePhotos.queries.js";
import { createPendingMessageBySlug, getApprovedMessagesBySlug } from "../db/queries/pageMessages.queries.js";
import { getTextBlocksBySlug } from "../db/queries/pageTextBlocks.queries.js";

// GET /api/pages/:slug
export async function getPageBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slugParam = req.params.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
    const page = await getSpecialPageBySlug(slug ?? "");

    if (!page) return res.status(404).json({ error: "Page not found" });
    return res.json(page);
  } catch (err) {
    return next(err);
  }
}

export async function getPhotosByPageSlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slugParam = req.params.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
    const photos = await getPagePhotosBySlug(slug ?? "");
    return res.json({ items: photos });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/pages/:slug/photos/:photoId/image — BYTEA veya harici file_url yonlendirmesi */
export async function getPagePhotoImage(req: Request, res: Response, next: NextFunction) {
  try {
    const slugParam = req.params.slug;
    const photoIdParam = req.params.photoId;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
    const photoId = Array.isArray(photoIdParam) ? photoIdParam[0] : photoIdParam;
    if (!slug || !photoId) return res.status(400).json({ error: "slug and photoId required" });

    const row = await getPagePhotoBlobBySlug(slug, photoId);
    if (!row) return res.status(404).end();

    if (row.imageData && row.imageData.length > 0) {
      res.setHeader("Content-Type", row.mimeType || "application/octet-stream");
      res.setHeader("Cache-Control", "public, max-age=86400");
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

export async function getMessagesByPageSlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slugParam = req.params.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
    const messages = await getApprovedMessagesBySlug(slug ?? "");
    return res.json({ items: messages });
  } catch (err) {
    return next(err);
  }
}

export async function getTextsByPageSlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slugParam = req.params.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
    const items = await getTextBlocksBySlug(slug ?? "");
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
}

export async function postMessageByPageSlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slugParam = req.params.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

    const body = req.body as unknown as {
      authorName?: unknown;
      authorEmail?: unknown;
      messageText?: unknown;
    };

    const authorName = typeof body.authorName === "string" ? body.authorName.trim() : "";
    const authorEmail =
      typeof body.authorEmail === "string" && body.authorEmail.trim().length > 0 ? body.authorEmail.trim() : null;
    const messageText = typeof body.messageText === "string" ? body.messageText.trim() : "";

    if (!slug) return res.status(400).json({ error: "Slug is required" });
    if (!authorName) return res.status(400).json({ error: "authorName is required" });
    if (!messageText) return res.status(400).json({ error: "messageText is required" });

    const message = await createPendingMessageBySlug(slug, {
      authorName,
      authorEmail,
      messageText,
    });

    return res.status(201).json({
      item: message,
      pending: true,
      notice: "Mesajınız alındı. Sayfa sahibi onayladıktan sonra görünecek.",
    });
  } catch (err) {
    return next(err);
  }
}

