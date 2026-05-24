import type { NextFunction, Request, Response } from "express";
import { getPgUniqueConstraint } from "../utils/pgErrors.js";
import {
  createPage,
  deletePage,
  getPageByIdAdmin,
  getPageBySlugAdmin,
  listPagesByOwner,
  updatePage,
  type CreatePageInput,
  type UpdatePageInput,
} from "../db/queries/dashboardPages.queries.js";
import { getPageContentByPageId, upsertPageContentByPageId } from "../db/queries/pageContent.queries.js";
import {
  countPhotosForPage,
  deletePagePhoto as deleteStoredPagePhoto,
  getPageTemplatePhotoLimit,
  insertInlinePagePhoto,
} from "../db/queries/pagePhotos.queries.js";

function getQueryParamString(req: Request, key: string): string | null {
  const v = (req.query as any)?.[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0] ?? null;
  return null;
}

function normalizeParamToString(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export async function listPages(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerUserId = getQueryParamString(req, "ownerUserId");
    if (!ownerUserId) return res.status(400).json({ error: "ownerUserId query param required" });

    const items = await listPagesByOwner(ownerUserId);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
}

export async function getPage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    const page = await getPageByIdAdmin(id);
    if (!page) return res.status(404).json({ error: "Page not found" });
    return res.json(page);
  } catch (err) {
    return next(err);
  }
}

export async function getPageBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = normalizeParamToString(req.params.slug);
    if (!slug) return res.status(400).json({ error: "slug is required" });
    const page = await getPageBySlugAdmin(slug);
    if (!page) return res.status(404).json({ error: "Page not found" });
    return res.json(page);
  } catch (err) {
    return next(err);
  }
}

export async function postPage(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as unknown as Partial<CreatePageInput>;

    const ownerUserId = typeof body.ownerUserId === "string" ? body.ownerUserId : "";
    const slug = typeof body.slug === "string" ? body.slug : "";
    const templateId = typeof body.templateId === "string" ? body.templateId : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const eventType = body.eventType === undefined ? null : (body.eventType as any);
    const eventDate = body.eventDate === undefined ? null : (body.eventDate as any);
    const mainText = body.mainText === undefined ? null : (body.mainText as any);
    const heroImageUrl = body.heroImageUrl === undefined ? null : (body.heroImageUrl as any);
    const isPublic = typeof body.isPublic === "boolean" ? body.isPublic : true;
    const accessPassword = body.accessPassword === undefined ? null : (body.accessPassword as any);
    const customDomain = body.customDomain === undefined ? null : (body.customDomain as any);
    const status = (body.status as any) || "draft";
    const settings = body.settings && typeof body.settings === "object" ? (body.settings as any) : {};

    if (!ownerUserId || !slug || !templateId || !title) return res.status(400).json({ error: "ownerUserId, slug, templateId, title required" });
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return res.status(400).json({ error: "Invalid slug format" });

    const created = await createPage({
      ownerUserId,
      slug,
      templateId,
      title,
      eventType: eventType ?? null,
      eventDate: eventDate ?? null,
      mainText: mainText ?? null,
      heroImageUrl: heroImageUrl ?? null,
      isPublic,
      accessPassword: accessPassword ?? null,
      customDomain: customDomain ?? null,
      status,
      settings,
    });

    return res.status(201).json(created);
  } catch (err) {
    const c = getPgUniqueConstraint(err);
    if (c === "special_pages_slug_key") {
      return res.status(409).json({
        error: "Bu sayfa adresi (slug) zaten kullanılıyor. Başka bir adres seçin.",
      });
    }
    return next(err);
  }
}

export async function patchPage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    const body = req.body as unknown as UpdatePageInput;

    if (typeof body.slug === "string" && body.slug.length > 0 && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)) {
      return res.status(400).json({ error: "Invalid slug format" });
    }

    const updated = await updatePage(id, body);
    if (!updated) return res.status(404).json({ error: "Page not found" });
    return res.json(updated);
  } catch (err) {
    const c = getPgUniqueConstraint(err);
    if (c === "special_pages_slug_key") {
      return res.status(409).json({
        error: "Bu sayfa adresi (slug) zaten kullanılıyor. Başka bir adres seçin.",
      });
    }
    return next(err);
  }
}

export async function removePage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    const ok = await deletePage(id);
    if (!ok) return res.status(404).json({ error: "Page not found" });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export async function upsertPageContent(req: Request, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });

    const body = req.body as Record<string, unknown>;
    const hasPhotos = Object.prototype.hasOwnProperty.call(body, "photos");
    const hasTexts = Object.prototype.hasOwnProperty.call(body, "texts");

    if (hasPhotos && !Array.isArray(body.photos)) {
      return res.status(400).json({ error: "photos must be an array when provided" });
    }
    if (hasTexts && !Array.isArray(body.texts)) {
      return res.status(400).json({ error: "texts must be an array when provided" });
    }

    const themeColor = typeof body.themeColor === "string" ? body.themeColor.trim() : null;
    const musicUrl = typeof body.musicUrl === "string" ? body.musicUrl.trim() : null;

    const photos = hasPhotos ? (body.photos as unknown[]) : undefined;
    const texts = hasTexts ? (body.texts as unknown[]) : undefined;

    const normalizedPhotos =
      photos === undefined
        ? undefined
        : photos
            .map((p: any, idx) => ({
              fileUrl: typeof p?.fileUrl === "string" ? p.fileUrl.trim() : "",
              thumbnailUrl: typeof p?.thumbnailUrl === "string" ? p.thumbnailUrl.trim() : null,
              caption: typeof p?.caption === "string" ? p.caption.trim() : null,
              sortOrder: typeof p?.sortOrder === "number" ? p.sortOrder : idx + 1,
            }))
            .filter((p) => p.fileUrl.length > 0);

    const normalizedTexts =
      texts === undefined
        ? undefined
        : texts
            .map((t: any, idx) => ({
              blockKey: typeof t?.blockKey === "string" ? t.blockKey.trim() : `text-${idx + 1}`,
              content: typeof t?.content === "string" ? t.content.trim() : "",
              sortOrder: typeof t?.sortOrder === "number" ? t.sortOrder : idx + 1,
            }))
            .filter((t) => t.content.length > 0);

    await upsertPageContentByPageId(id, {
      photos: normalizedPhotos,
      texts: normalizedTexts,
      themeColor,
      musicUrl,
    });

    const content = await getPageContentByPageId(id);
    return res.json(content);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("allows maximum")) {
      return res.status(400).json({ error: message });
    }
    if (message === "Page not found") {
      return res.status(404).json({ error: message });
    }
    return next(err);
  }
}

type UploadedRequest = Request & { file?: Express.Multer.File };

export async function uploadDashboardPagePhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });

    const file = (req as UploadedRequest).file;
    if (!file?.buffer?.length) {
      return res.status(400).json({ error: "file required (multipart field name: file)" });
    }

    const page = await getPageByIdAdmin(id);
    if (!page) return res.status(404).json({ error: "Page not found" });

    const maxPhotos = await getPageTemplatePhotoLimit(id);
    const count = await countPhotosForPage(id);
    if (typeof maxPhotos === "number" && count >= maxPhotos) {
      return res.status(400).json({ error: `Bu şablonda en fazla ${maxPhotos} fotoğraf kullanabilirsiniz.` });
    }

    const created = await insertInlinePagePhoto(id, file.buffer, file.mimetype);
    return res.status(201).json(created);
  } catch (err) {
    return next(err);
  }
}

export async function deleteDashboardPagePhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    const photoId = normalizeParamToString(req.params.photoId);
    if (!id || !photoId) return res.status(400).json({ error: "id and photoId required" });

    const ok = await deleteStoredPagePhoto(id, photoId);
    if (!ok) return res.status(404).json({ error: "Photo not found" });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export async function getPageContent(req: Request, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    const content = await getPageContentByPageId(id);
    if (!content) return res.status(404).json({ error: "Page not found" });
    return res.json(content);
  } catch (err) {
    return next(err);
  }
}

