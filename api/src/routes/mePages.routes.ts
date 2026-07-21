import express from "express";
import multer from "multer";
import {
  approveMyPageMessage,
  checkMySlugAvailability,
  deleteMyPagePhoto,
  getMyPage,
  getMyPageBySlug,
  getMyPageContent,
  listMyPageMessages,
  listMyPages,
  patchMyPage,
  removeMyPageMessage,
  postMyPage,
  removeMyPage,
  uploadMyPagePhoto,
  upsertMyPageContent,
} from "../controllers/mePages.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    cb(null, ok);
  },
});

router.use("/api/me/pages", requireAuth);

router.get("/api/me/pages", listMyPages);
router.get("/api/me/pages/slug-available/:slug", checkMySlugAvailability);
router.get("/api/me/pages/by-slug/:slug", getMyPageBySlug);
router.get("/api/me/pages/:id", getMyPage);
router.post("/api/me/pages", postMyPage);
router.patch("/api/me/pages/:id", patchMyPage);
router.delete("/api/me/pages/:id", removeMyPage);
router.post("/api/me/pages/:id/photos", uploadPhoto.single("file"), uploadMyPagePhoto);
router.delete("/api/me/pages/:id/photos/:photoId", deleteMyPagePhoto);
router.get("/api/me/pages/:id/content", getMyPageContent);
router.put("/api/me/pages/:id/content", upsertMyPageContent);
router.get("/api/me/pages/:id/messages", listMyPageMessages);
router.patch("/api/me/pages/:id/messages/:messageId/approve", approveMyPageMessage);
router.delete("/api/me/pages/:id/messages/:messageId", removeMyPageMessage);

export default router;
