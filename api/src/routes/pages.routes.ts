import express from "express";
import {
  getPreviewPhotoImage,
  getPagePreview,
  getPreviewPhotos,
  getPreviewTexts,
} from "../controllers/pagePreview.controller.js";
import {
  getMessagesByPageSlug,
  getPageBySlug,
  getPagePhotoImage,
  getPhotosByPageSlug,
  getTextsByPageSlug,
  postMessageByPageSlug,
} from "../controllers/pages.controller.js";
import { optionalAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/api/preview/:slug", optionalAuth, getPagePreview);
router.get("/api/preview/:slug/photos", optionalAuth, getPreviewPhotos);
router.get("/api/preview/:slug/photos/:photoId/image", optionalAuth, getPreviewPhotoImage);
router.get("/api/preview/:slug/texts", optionalAuth, getPreviewTexts);

router.get("/api/pages/:slug", getPageBySlug);
router.get("/api/pages/:slug/photos/:photoId/image", getPagePhotoImage);
router.get("/api/pages/:slug/photos", getPhotosByPageSlug);
router.get("/api/pages/:slug/texts", getTextsByPageSlug);
router.get("/api/pages/:slug/messages", getMessagesByPageSlug);
router.post("/api/pages/:slug/messages", postMessageByPageSlug);

export default router;

