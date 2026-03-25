import express from "express";
import {
  listTemplates,
  getTemplate,
  patchTemplate,
  postTemplate,
  removeTemplate,
} from "../controllers/templates.controller.js";

const router = express.Router();

// /api/dashboard/templates/*
router.get("/api/dashboard/templates", listTemplates);
router.get("/api/dashboard/templates/:id", getTemplate);
router.post("/api/dashboard/templates", postTemplate);
router.patch("/api/dashboard/templates/:id", patchTemplate);
router.delete("/api/dashboard/templates/:id", removeTemplate);

export default router;

