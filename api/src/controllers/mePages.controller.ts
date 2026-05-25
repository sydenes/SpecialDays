import type { NextFunction, Response } from "express";
import { canManagePage } from "../auth/permissions.js";
import {
  createPage,
  getPageByIdAdmin,
  softDeletePage,
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
import type { AuthedRequest } from "../middleware/requireAuth.js";
import {
  approvePageMessage,
  deletePageMessage,
  listMessagesForPageId,
} from "../db/queries/pageMessages.queries.js";
import { getPgUniqueConstraint } from "../utils/pgErrors.js";
import { toPageApiResponse } from "../utils/pageResponse.js";

function normalizeParamToString(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

async function requireOwnedPage(req: AuthedRequest, pageId: string, allowDeleted = false) {
  const page = await getPageByIdAdmin(pageId);
  if (!page) return { ok: false as const, status: 404, error: "Page not found" };
  if (page.deletedAt && !allowDeleted) {
    return { ok: false as const, status: 410, error: "Bu sayfa silinmiş" };
  }
  const user = req.authUser!;
  if (!canManagePage(user, page.ownerUserId)) {
    return { ok: false as const, status: 403, error: "Bu sayfaya erisim yetkiniz yok" };
  }
  return { ok: true as const, page, user };
}

async function requireOwnedPageBySlug(req: AuthedRequest, slug: string) {
  const page = await getPageBySlugAdmin(slug);
  if (!page) return { ok: false as const, status: 404, error: "Page not found" };
  const user = req.authUser!;
  if (!canManagePage(user, page.ownerUserId)) {
    return { ok: false as const, status: 403, error: "Bu sayfaya erisim yetkiniz yok" };
  }
  return { ok: true as const, page, user };
}

function stripOwnerFromPatch(body: UpdatePageInput): UpdatePageInput {
  const next = { ...body };
  delete (next as { ownerUserId?: string }).ownerUserId;
  return next;
}

export async function listMyPages(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.authUser!;
    const items = await listPagesByOwner(user.id);
    return res.json({ items: items.map((p) => toPageApiResponse(p, user)) });
  } catch (err) {
    return next(err);
  }
}

export async function getMyPage(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    const access = await requireOwnedPage(req, id);
    if (!access.ok) return res.status(access.status).json({ error: access.error });
    return res.json(toPageApiResponse(access.page, access.user));
  } catch (err) {
    return next(err);
  }
}

export async function getMyPageBySlug(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const slug = normalizeParamToString(req.params.slug);
    if (!slug) return res.status(400).json({ error: "slug is required" });
    const access = await requireOwnedPageBySlug(req, slug);
    if (!access.ok) return res.status(access.status).json({ error: access.error });
    return res.json(toPageApiResponse(access.page, access.user));
  } catch (err) {
    return next(err);
  }
}

export async function postMyPage(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.authUser!;
    const body = req.body as unknown as Partial<CreatePageInput>;

    const slug = typeof body.slug === "string" ? body.slug : "";
    const templateId = typeof body.templateId === "string" ? body.templateId : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const statusRaw = (body.status as CreatePageInput["status"]) || "draft";
    const isPublic =
      typeof body.isPublic === "boolean" ? body.isPublic : statusRaw === "published";

    if (!slug || !templateId || !title) {
      return res.status(400).json({ error: "slug, templateId, title required" });
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return res.status(400).json({ error: "Invalid slug format" });
    }

    const created = await createPage({
      ownerUserId: user.id,
      slug,
      templateId,
      title,
      eventType: body.eventType ?? null,
      eventDate: body.eventDate ?? null,
      mainText: body.mainText ?? null,
      heroImageUrl: body.heroImageUrl ?? null,
      isPublic,
      accessPassword: body.accessPassword ?? null,
      customDomain: body.customDomain ?? null,
      status: statusRaw,
      settings: body.settings && typeof body.settings === "object" ? body.settings : {},
    });

    return res.status(201).json(toPageApiResponse(created, user));
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

export async function patchMyPage(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    const access = await requireOwnedPage(req, id);
    if (!access.ok) return res.status(access.status).json({ error: access.error });

    const body = stripOwnerFromPatch(req.body as UpdatePageInput);
    if (typeof body.slug === "string" && body.slug.length > 0 && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)) {
      return res.status(400).json({ error: "Invalid slug format" });
    }

    const updated = await updatePage(id, body);
    if (!updated) return res.status(404).json({ error: "Page not found" });
    return res.json(toPageApiResponse(updated, access.user));
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

export async function removeMyPage(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    const access = await requireOwnedPage(req, id);
    if (!access.ok) return res.status(access.status).json({ error: access.error });
    const updated = await softDeletePage(id);
    if (!updated) return res.status(404).json({ error: "Page not found" });
    return res.json(toPageApiResponse(updated, access.user));
  } catch (err) {
    return next(err);
  }
}

export async function getMyPageContent(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    const access = await requireOwnedPage(req, id);
    if (!access.ok) return res.status(access.status).json({ error: access.error });
    const content = await getPageContentByPageId(id);
    if (!content) return res.status(404).json({ error: "Page not found" });
    return res.json(content);
  } catch (err) {
    return next(err);
  }
}

export async function upsertMyPageContent(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    const access = await requireOwnedPage(req, id);
    if (!access.ok) return res.status(access.status).json({ error: access.error });

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
    if (message.includes("allows maximum")) return res.status(400).json({ error: message });
    if (message === "Page not found") return res.status(404).json({ error: message });
    return next(err);
  }
}

type UploadedRequest = AuthedRequest & { file?: Express.Multer.File };

export async function uploadMyPagePhoto(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    const access = await requireOwnedPage(req, id);
    if (!access.ok) return res.status(access.status).json({ error: access.error });

    const file = (req as UploadedRequest).file;
    if (!file?.buffer?.length) {
      return res.status(400).json({ error: "file required (multipart field name: file)" });
    }

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

export async function listMyPageMessages(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    const access = await requireOwnedPage(req, id);
    if (!access.ok) return res.status(access.status).json({ error: access.error });
    const items = await listMessagesForPageId(id);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
}

export async function approveMyPageMessage(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    const messageId = normalizeParamToString(req.params.messageId);
    if (!id || !messageId) return res.status(400).json({ error: "id and messageId required" });
    const access = await requireOwnedPage(req, id);
    if (!access.ok) return res.status(access.status).json({ error: access.error });
    const updated = await approvePageMessage(id, messageId);
    if (!updated) return res.status(404).json({ error: "Message not found" });
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function removeMyPageMessage(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    const messageId = normalizeParamToString(req.params.messageId);
    if (!id || !messageId) return res.status(400).json({ error: "id and messageId required" });
    const access = await requireOwnedPage(req, id);
    if (!access.ok) return res.status(access.status).json({ error: access.error });
    const ok = await deletePageMessage(id, messageId);
    if (!ok) return res.status(404).json({ error: "Message not found" });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export async function deleteMyPagePhoto(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    const photoId = normalizeParamToString(req.params.photoId);
    if (!id || !photoId) return res.status(400).json({ error: "id and photoId required" });
    const access = await requireOwnedPage(req, id);
    if (!access.ok) return res.status(access.status).json({ error: access.error });

    const ok = await deleteStoredPagePhoto(id, photoId);
    if (!ok) return res.status(404).json({ error: "Photo not found" });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}
