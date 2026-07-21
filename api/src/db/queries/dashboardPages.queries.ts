import { randomBytes } from "node:crypto";
import { pool } from "../pool.js";
import {
  mapSpecialPageAdminRow,
  specialPagesEntityAdmin,
  type SpecialPageAdmin,
} from "../../entities/specialPage.entity.js";
import { hashPassword } from "../../utils/password.js";

export type CreatePageInput = {
  ownerUserId: string;
  slug: string;
  templateId: string;
  title: string;
  eventType?: string | null;
  eventDate?: string | Date | null;
  mainText?: string | null;
  heroImageUrl?: string | null;
  isPublic?: boolean;
  accessPassword?: string | null;
  customDomain?: string | null;
  status?: "draft" | "published" | "archived";
  settings?: Record<string, unknown>;
};

export type UpdatePageInput = Partial<CreatePageInput> & {
  // PATCH icin accessPassword ayni sekilde kullanilacak
  accessPassword?: string | null;
};

export async function listPagesByOwner(ownerUserId: string): Promise<SpecialPageAdmin[]> {
  const { rows } = await pool.query(
    `${specialPagesEntityAdmin.selectById} WHERE sp.owner_user_id = $1 AND sp.deleted_at IS NULL ORDER BY sp.created_at DESC`,
    [ownerUserId]
  );

  return (rows as any[]).map((r) => mapSpecialPageAdminRow(r));
}

export async function listAllPagesAdmin(): Promise<SpecialPageAdmin[]> {
  const { rows } = await pool.query(
    `${specialPagesEntityAdmin.selectById} ORDER BY sp.created_at DESC`
  );
  return (rows as any[]).map((r) => mapSpecialPageAdminRow(r));
}

export async function getPageByIdAdmin(id: string): Promise<SpecialPageAdmin | null> {
  const { rows } = await pool.query(`${specialPagesEntityAdmin.selectById} WHERE sp.id = $1`, [id]);
  if (rows.length === 0) return null;
  return mapSpecialPageAdminRow(rows[0] as any);
}

export async function getPageBySlugAdmin(slug: string): Promise<SpecialPageAdmin | null> {
  const { rows } = await pool.query(`${specialPagesEntityAdmin.selectBySlug} WHERE sp.slug = $1`, [slug]);
  if (rows.length === 0) return null;
  return mapSpecialPageAdminRow(rows[0] as any);
}

/** Slug kullanımda mı? (silinmiş satırlar unique constraint nedeniyle hâlâ “alınmış” sayılır) */
export async function isSlugTaken(slug: string, excludePageId?: string | null): Promise<boolean> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return false;
  if (excludePageId) {
    const { rows } = await pool.query(
      `SELECT 1 FROM special_pages WHERE slug = $1 AND id <> $2 LIMIT 1`,
      [normalized, excludePageId]
    );
    return rows.length > 0;
  }
  const { rows } = await pool.query(`SELECT 1 FROM special_pages WHERE slug = $1 LIMIT 1`, [normalized]);
  return rows.length > 0;
}

export async function createPage(input: CreatePageInput): Promise<SpecialPageAdmin> {
  const {
    ownerUserId,
    slug,
    templateId,
    title,
    eventType = null,
    eventDate = null,
    mainText = null,
    heroImageUrl = null,
    isPublic = true,
    accessPassword = null,
    customDomain = null,
    status = "draft",
    settings = {},
  } = input;

  const accessPasswordHash = accessPassword ? await hashPassword(accessPassword) : null;

  const publishedAt = status === "published" ? new Date() : null;
  const previewToken = randomBytes(24).toString("hex");
  const isPublicEffective = status === "published" ? (isPublic ?? true) : false;

  await pool.query(
    `
    INSERT INTO special_pages (
      owner_user_id,
      slug,
      template_id,
      title,
      event_type,
      event_date,
      main_text,
      hero_image_url,
      is_public,
      access_password_hash,
      custom_domain,
      status,
      preview_token,
      settings,
      published_at
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15
    )
    `,
    [
      ownerUserId,
      slug,
      templateId,
      title,
      eventType,
      eventDate ? new Date(eventDate as any) : null,
      mainText,
      heroImageUrl,
      isPublicEffective,
      accessPasswordHash,
      customDomain,
      status,
      previewToken,
      JSON.stringify(settings ?? {}),
      publishedAt,
    ]
  );

  const created = await getPageBySlugAdmin(slug);
  if (!created) throw new Error("Page create failed (not found after insert)");
  return created;
}

export async function updatePage(id: string, input: UpdatePageInput): Promise<SpecialPageAdmin | null> {
  const sets: string[] = [];
  const params: any[] = [];

  const pushSet = (column: string, value: any) => {
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  };

  if (typeof input.ownerUserId === "string") pushSet("owner_user_id", input.ownerUserId);
  if (typeof input.slug === "string") pushSet("slug", input.slug);
  if (typeof input.templateId === "string") pushSet("template_id", input.templateId);
  if (typeof input.title === "string") pushSet("title", input.title);
  if ("eventType" in input) pushSet("event_type", input.eventType ?? null);
  if ("eventDate" in input) pushSet("event_date", input.eventDate ? new Date(input.eventDate as any) : null);
  if ("mainText" in input) pushSet("main_text", input.mainText ?? null);
  if ("heroImageUrl" in input) pushSet("hero_image_url", input.heroImageUrl ?? null);
  if ("isPublic" in input) pushSet("is_public", input.isPublic ?? true);
  if ("customDomain" in input) pushSet("custom_domain", input.customDomain ?? null);
  if ("settings" in input) {
    params.push(JSON.stringify(input.settings ?? {}));
    sets.push(`settings = $${params.length}::jsonb`);
  }

  if ("accessPassword" in input) {
    const accessPasswordHash = input.accessPassword ? await hashPassword(input.accessPassword) : null;
    pushSet("access_password_hash", accessPasswordHash);
  }

  if ("status" in input) {
    pushSet("status", input.status ?? "draft");
    const statusValue = (input.status ?? "draft") as "draft" | "published" | "archived";
    pushSet("published_at", statusValue === "published" ? new Date() : null);
  }

  if (sets.length === 0) return getPageByIdAdmin(id);

  const { rows } = await pool.query(
    `
    UPDATE special_pages
    SET ${sets.join(", ")}
    WHERE id = $${params.length + 1}
    RETURNING id
    `,
    [...params, id]
  );

  if (rows.length === 0) return null;
  return getPageByIdAdmin(rows[0].id);
}

export async function softDeletePage(id: string): Promise<SpecialPageAdmin | null> {
  const { rows } = await pool.query(
    `UPDATE special_pages SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [id]
  );
  if (rows.length === 0) return null;
  return getPageByIdAdmin(id);
}

/** @deprecated use softDeletePage */
export async function deletePage(id: string): Promise<boolean> {
  const page = await softDeletePage(id);
  return Boolean(page);
}

