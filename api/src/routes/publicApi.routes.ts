import express from "express";
import { listCategories, listTemplatesForCategory } from "../controllers/categories.controller.js";
import { getPublicTemplate, listPublicTemplates } from "../controllers/templates.controller.js";

const router = express.Router();

router.get("/api/categories", listCategories);
router.get("/api/categories/:categoryCode/templates", listTemplatesForCategory);
router.get("/api/templates", listPublicTemplates);
router.get("/api/templates/:id", getPublicTemplate);

export default router;
