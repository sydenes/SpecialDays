import express from "express";
import { getPublicTemplate, listPublicTemplates } from "../controllers/templates.controller.js";

const router = express.Router();

router.get("/api/templates", listPublicTemplates);
router.get("/api/templates/:id", getPublicTemplate);

export default router;
