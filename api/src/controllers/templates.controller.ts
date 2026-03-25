import type { NextFunction, Request, Response } from "express";
import {
  createTemplate,
  deleteTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  type CreateTemplateInput,
  type UpdateTemplateInput,
} from "../db/queries/templates.queries.js";

function normalizeParamToString(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export async function listTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const templates = await getAllTemplates();
    return res.json({ items: templates });
  } catch (err) {
    return next(err);
  }
}

export async function getTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    const tpl = await getTemplateById(id);
    if (!tpl) return res.status(404).json({ error: "Template not found" });
    return res.json(tpl);
  } catch (err) {
    return next(err);
  }
}

export async function postTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as unknown as Partial<CreateTemplateInput>;

    const code = typeof body.code === "string" ? body.code.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const previewImageUrl = typeof body.previewImageUrl === "string" ? body.previewImageUrl.trim() : null;
    const configSchema =
      body.configSchema && typeof body.configSchema === "object" ? (body.configSchema as Record<string, unknown>) : {};
    const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

    if (!code || !name || !category) return res.status(400).json({ error: "code, name, category required" });

    const tpl = await createTemplate({
      code,
      name,
      category,
      previewImageUrl,
      configSchema,
      isActive,
    });

    return res.status(201).json(tpl);
  } catch (err) {
    return next(err);
  }
}

export async function patchTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    const body = req.body as unknown as UpdateTemplateInput;

    const tpl = await updateTemplate(id, body);
    if (!tpl) return res.status(404).json({ error: "Template not found" });
    return res.json(tpl);
  } catch (err) {
    return next(err);
  }
}

export async function removeTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = normalizeParamToString(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    const ok = await deleteTemplate(id);
    if (!ok) return res.status(404).json({ error: "Template not found" });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

