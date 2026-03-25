import express from "express";
import {
  getPageContent,
  listPages,
  getPage,
  postPage,
  patchPage,
  removePage,
  upsertPageContent,
} from "../controllers/dashboardPages.controller.js";

const router = express.Router();

// /api/dashboard/pages/*
router.get("/api/dashboard/pages", listPages);
router.get("/api/dashboard/pages/:id", getPage);
router.post("/api/dashboard/pages", postPage);
router.patch("/api/dashboard/pages/:id", patchPage);
router.delete("/api/dashboard/pages/:id", removePage);
router.get("/api/dashboard/pages/:id/content", getPageContent);
router.put("/api/dashboard/pages/:id/content", upsertPageContent);

export default router;

