import { pool } from "../pool.js";
import { templatesEntity, mapTemplateRow, type Template } from "../../entities/templates.entity.js";

export type CreateTemplateInput = {
  code: string;
  name: string;
  category: string;
  previewImageUrl?: string | null;
  configSchema?: Record<string, unknown>;
  isActive?: boolean;
};

export async function getAllTemplates(): Promise<Template[]> {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      code,
      name,
      category,
      preview_image_url,
      config_schema,
      is_active,
      created_at,
      updated_at
    FROM templates
    ORDER BY created_at DESC
    `
  );

  return (rows as any[]).map((r) => mapTemplateRow(r));
}

export async function getTemplateById(id: string): Promise<Template | null> {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      code,
      name,
      category,
      preview_image_url,
      config_schema,
      is_active,
      created_at,
      updated_at
    FROM templates
    WHERE id = $1
    `,
    [id]
  );

  if (rows.length === 0) return null;
  return mapTemplateRow(rows[0] as any);
}

export async function createTemplate(input: CreateTemplateInput): Promise<Template> {
  const {
    code,
    name,
    category,
    previewImageUrl = null,
    configSchema = {},
    isActive = true,
  } = input;

  const { rows } = await pool.query(
    `
    INSERT INTO templates (code, name, category, preview_image_url, config_schema, is_active)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6)
    RETURNING
      id,
      code,
      name,
      category,
      preview_image_url,
      config_schema,
      is_active,
      created_at,
      updated_at
    `,
    [code, name, category, previewImageUrl, JSON.stringify(configSchema), isActive]
  );

  return mapTemplateRow(rows[0] as any);
}

export type UpdateTemplateInput = Partial<CreateTemplateInput>;

export async function updateTemplate(id: string, input: UpdateTemplateInput): Promise<Template | null> {
  const sets: string[] = [];
  const params: any[] = [];

  const pushSet = (column: string, value: any) => {
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  };

  if (typeof input.code === "string") pushSet("code", input.code);
  if (typeof input.name === "string") pushSet("name", input.name);
  if (typeof input.category === "string") pushSet("category", input.category);
  if ("previewImageUrl" in input) pushSet("preview_image_url", input.previewImageUrl ?? null);
  if ("configSchema" in input) {
    params.push(JSON.stringify(input.configSchema ?? {}));
    sets.push(`config_schema = $${params.length}::jsonb`);
  }
  if (typeof input.isActive === "boolean") pushSet("is_active", input.isActive);

  if (sets.length === 0) {
    return getTemplateById(id);
  }

  const { rows } = await pool.query(
    `
    UPDATE ${templatesEntity.table}
    SET ${sets.join(", ")}
    WHERE id = $${params.length + 1}
    RETURNING
      id,
      code,
      name,
      category,
      preview_image_url,
      config_schema,
      is_active,
      created_at,
      updated_at
    `,
    [...params, id]
  );

  if (rows.length === 0) return null;
  return mapTemplateRow(rows[0] as any);
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(`DELETE FROM ${templatesEntity.table} WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

/** Aktif sablonlar (pazarlama / sablon secim sayfasi) */
export async function getPublicTemplates(): Promise<Template[]> {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      code,
      name,
      category,
      preview_image_url,
      config_schema,
      is_active,
      created_at,
      updated_at
    FROM templates
    WHERE is_active = TRUE
    ORDER BY category ASC, name ASC
    `
  );

  return (rows as any[]).map((r) => mapTemplateRow(r));
}

