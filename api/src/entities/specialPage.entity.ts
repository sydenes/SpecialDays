export type SpecialPage = {
  slug: string;
  templateId: string;
  templateCode: string;
  templateName: string;
  templateCategory: string;
  title: string;
  eventDate: Date | null;
  mainText: string | null;
  settings: Record<string, unknown>;
};

export type SpecialPageAdmin = {
  id: string;
  ownerUserId: string;
  slug: string;
  templateId: string;
  templateCode: string;
  templateName: string;
  templateCategory: string;
  title: string;
  eventType: string | null;
  eventDate: Date | null;
  mainText: string | null;
  heroImageUrl: string | null;
  isPublic: boolean;
  accessPasswordHash: string | null;
  customDomain: string | null;
  status: "draft" | "published" | "archived";
  viewCount: number;
  settings: Record<string, unknown>;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Entity: `special_pages`
 * (ORM degil; sadece "DB alanlari -> JS model" mapping standardi)
 */
export const specialPagesEntity = {
  table: "special_pages",
  selectBySlug: `
    SELECT
      slug,
      template_id AS "templateId",
      t.code AS "templateCode",
      t.name AS "templateName",
      t.category AS "templateCategory",
      title,
      event_date AS "eventDate",
      main_text AS "mainText",
      sp.settings AS "settings"
    FROM special_pages sp
    JOIN templates t ON t.id = sp.template_id
  `,
};

export function mapSpecialPageRow(row: {
  slug: string;
  templateId: string;
  templateCode: string;
  templateName: string;
  templateCategory: string;
  title: string;
  eventDate: Date | null;
  mainText: string | null;
  settings?: Record<string, unknown> | null;
}): SpecialPage {
  return {
    slug: row.slug,
    templateId: row.templateId,
    templateCode: row.templateCode,
    templateName: row.templateName,
    templateCategory: row.templateCategory,
    title: row.title,
    eventDate: row.eventDate,
    mainText: row.mainText,
    settings: row.settings && typeof row.settings === "object" ? row.settings : {},
  };
}

export const specialPagesEntityAdmin = {
  table: "special_pages",
  selectById: `
    SELECT
      sp.id,
      sp.owner_user_id AS "ownerUserId",
      sp.slug,
      sp.template_id AS "templateId",
      t.code AS "templateCode",
      t.name AS "templateName",
      t.category AS "templateCategory",
      sp.title,
      sp.event_type AS "eventType",
      sp.event_date AS "eventDate",
      sp.main_text AS "mainText",
      sp.hero_image_url AS "heroImageUrl",
      sp.is_public AS "isPublic",
      sp.access_password_hash AS "accessPasswordHash",
      sp.custom_domain AS "customDomain",
      sp.status,
      sp.view_count AS "viewCount",
      sp.settings AS "settings",
      sp.published_at AS "publishedAt",
      sp.created_at AS "createdAt",
      sp.updated_at AS "updatedAt"
    FROM special_pages sp
    JOIN templates t ON t.id = sp.template_id
  `,
};

export function mapSpecialPageAdminRow(row: {
  id: string;
  ownerUserId: string;
  slug: string;
  templateId: string;
  templateCode: string;
  templateName: string;
  templateCategory: string;
  title: string;
  eventType: string | null;
  eventDate: Date | null;
  mainText: string | null;
  heroImageUrl: string | null;
  isPublic: boolean;
  accessPasswordHash: string | null;
  customDomain: string | null;
  status: "draft" | "published" | "archived";
  viewCount: number;
  settings: Record<string, unknown>;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SpecialPageAdmin {
  return row as unknown as SpecialPageAdmin;
}

