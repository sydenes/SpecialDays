import express from "express";
import {
  getMessagesByPageSlug,
  getPageBySlug,
  getPagePhotoImage,
  getPhotosByPageSlug,
  getTextsByPageSlug,
  postMessageByPageSlug,
} from "../controllers/pages.controller.js";

const router = express.Router();

router.get("/api/pages/:slug", getPageBySlug);
router.get("/api/pages/:slug/photos/:photoId/image", getPagePhotoImage);
router.get("/api/pages/:slug/photos", getPhotosByPageSlug);
router.get("/api/pages/:slug/texts", getTextsByPageSlug);
router.get("/api/pages/:slug/messages", getMessagesByPageSlug);
router.post("/api/pages/:slug/messages", postMessageByPageSlug);

export default router;

