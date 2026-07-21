import type { NextFunction, Request, Response } from "express";
import {
  createPage,
  softDeletePage,
  getPageByIdAdmin,
  getPageBySlugAdmin,
  listAllPagesAdmin,
  listPagesByOwner,
  updatePage,
  type CreatePageInput,
  type UpdatePageInput,
} from "../db/queries/dashboardPages.queries.js";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { getPgUniqueConstraint } from "../utils/pgErrors.js";
import { toPageApiResponse } from "../utils/pageResponse.js";
import { getPageContentByPageId, upsertPageContentByPageId } from "../db/queries/pageContent.queries.js";
import {
  countPhotosForPage,
  deletePagePhoto as deleteStoredPagePhoto,
  getPageTemplatePhotoLimit,
  insertInlinePagePhoto,
} from "../db/queries/pagePhotos.queries.js";
import { getTrackById } from "../music/library.js";

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

export async function listPages(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.authUser!;
    const ownerUserId = getQueryParamString(req, "ownerUserId");
    const items = ownerUserId ? await listPagesByOwner(ownerUserId) : await listAllPagesAdmin();
    return res.json({ items: items.map((p) => toPageApiResponse(p, user)) });
  } catch (err) {
    return next(err);
  }
}

export async function getPage(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    const page = await getPageByIdAdmin(id);
    if (!page) return res.status(404).json({ error: "Page not found" });
    return res.json(toPageApiResponse(page, req.authUser!));
  } catch (err) {
    return next(err);
  }
}

export async function getPageBySlug(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const slug = normalizeParamToString(req.params.slug);
    if (!slug) return res.status(400).json({ error: "slug is required" });
    const page = await getPageBySlugAdmin(slug);
    if (!page) return res.status(404).json({ error: "Page not found" });
    return res.json(toPageApiResponse(page, req.authUser!));
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
    const statusRaw = (body.status as any) || "draft";
    const isPublic =
      typeof body.isPublic === "boolean" ? body.isPublic : statusRaw === "published";
    const accessPassword = body.accessPassword === undefined ? null : (body.accessPassword as any);
    const customDomain = body.customDomain === undefined ? null : (body.customDomain as any);
    const status = statusRaw;
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

    return res.status(201).json(toPageApiResponse(created, (req as AuthedRequest).authUser!));
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

export async function patchPage(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    const body = req.body as unknown as UpdatePageInput;

    if (typeof body.slug === "string" && body.slug.length > 0 && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)) {
      return res.status(400).json({ error: "Invalid slug format" });
    }

    const updated = await updatePage(id, body);
    if (!updated) return res.status(404).json({ error: "Page not found" });
    return res.json(toPageApiResponse(updated, req.authUser!));
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
    const updated = await softDeletePage(id);
    if (!updated) return res.status(404).json({ error: "Page not found" });
    return res.json(toPageApiResponse(updated, req.authUser!));
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
    const musicIdRaw = typeof body.musicId === "string" ? body.musicId.trim() : "";
    const musicId = musicIdRaw || null;
    if (musicId && !getTrackById(musicId)) {
      return res.status(400).json({ error: "Geçersiz müzik seçimi." });
    }

    const giftEnabled = body.giftEnabled === true;
    const giftBankName =
      typeof body.giftBankName === "string" && body.giftBankName.trim()
        ? body.giftBankName.trim()
        : null;
    const giftRecipientName =
      typeof body.giftRecipientName === "string" && body.giftRecipientName.trim()
        ? body.giftRecipientName.trim()
        : null;
    const giftIbanRaw = typeof body.giftIban === "string" ? body.giftIban.replace(/\s+/g, "").toUpperCase() : "";
    const giftIban = giftIbanRaw || null;
    if (giftEnabled && !giftIban) {
      return res.status(400).json({ error: "Dijital takı açıkken IBAN gerekli." });
    }

    const locationEnabled = body.locationEnabled === true;
    const locationVenueName =
      typeof body.locationVenueName === "string" && body.locationVenueName.trim()
        ? body.locationVenueName.trim()
        : null;
    const locationAddress =
      typeof body.locationAddress === "string" && body.locationAddress.trim()
        ? body.locationAddress.trim()
        : null;
    const locationLat =
      typeof body.locationLat === "number" && Number.isFinite(body.locationLat) ? body.locationLat : null;
    const locationLon =
      typeof body.locationLon === "number" && Number.isFinite(body.locationLon) ? body.locationLon : null;
    if (locationEnabled && !locationVenueName && !locationAddress) {
      return res.status(400).json({ error: "Konum açıkken mekan adı veya adres gerekli." });
    }

    const components =
      body.components && typeof body.components === "object" && !Array.isArray(body.components)
        ? (body.components as Record<string, unknown>)
        : null;

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
      musicUrl: musicId ? null : musicUrl,
      musicId,
      giftEnabled,
      giftBankName,
      giftRecipientName,
      giftIban,
      locationEnabled,
      locationVenueName,
      locationAddress,
      locationLat,
      locationLon,
      components,
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

