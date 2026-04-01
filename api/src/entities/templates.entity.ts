export type Template = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  previewImageUrl: string | null;
  configSchema: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const templatesEntity = {
  table: "templates",
  columns: [
    "id",
    "code",
    "name",
    "category",
    "preview_image_url",
    "config_schema",
    "is_active",
    "created_at",
    "updated_at",
  ],
} as const;

export function mapTemplateRow(row: {
  id: string;
  code: string;
  name: string;
  category: string | null;
  preview_image_url: string | null;
  config_schema: Record<string, unknown>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}): Template {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category ?? null,
    previewImageUrl: row.preview_image_url,
    configSchema: row.config_schema ?? {},
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

