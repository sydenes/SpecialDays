import express from "express";
import multer from "multer";
import {
  getPageContent,
  listPages,
  getPage,
  getPageBySlug,
  postPage,
  patchPage,
  removePage,
  upsertPageContent,
  uploadDashboardPagePhoto,
  deleteDashboardPagePhoto,
} from "../controllers/dashboardPages.controller.js";

const router = express.Router();

const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    cb(null, ok);
  },
});

// /api/dashboard/pages/*
router.get("/api/dashboard/pages", listPages);
router.get("/api/dashboard/pages/by-slug/:slug", getPageBySlug);
router.get("/api/dashboard/pages/:id", getPage);
router.post("/api/dashboard/pages", postPage);
router.patch("/api/dashboard/pages/:id", patchPage);
router.delete("/api/dashboard/pages/:id", removePage);
router.post("/api/dashboard/pages/:id/photos", uploadPhoto.single("file"), uploadDashboardPagePhoto);
router.delete("/api/dashboard/pages/:id/photos/:photoId", deleteDashboardPagePhoto);
router.get("/api/dashboard/pages/:id/content", getPageContent);
router.put("/api/dashboard/pages/:id/content", upsertPageContent);

export default router;

