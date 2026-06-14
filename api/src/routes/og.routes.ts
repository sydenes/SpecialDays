import express from "express";
import { getOgMetaJson, getOgPreviewHtml } from "../controllers/og.controller.js";

const router = express.Router();

router.get("/api/og/:slug", getOgMetaJson);
router.get("/og-preview/:slug", getOgPreviewHtml);

export default router;
