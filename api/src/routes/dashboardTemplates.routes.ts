import express from "express";
import {
  listTemplates,
  getTemplate,
  patchTemplate,
  postTemplate,
  removeTemplate,
} from "../controllers/templates.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();

router.use("/api/dashboard/templates", requireAuth, requireAdmin);

// /api/dashboard/templates/*
router.get("/api/dashboard/templates", listTemplates);
router.get("/api/dashboard/templates/:id", getTemplate);
router.post("/api/dashboard/templates", postTemplate);
router.patch("/api/dashboard/templates/:id", patchTemplate);
router.delete("/api/dashboard/templates/:id", removeTemplate);

export default router;

