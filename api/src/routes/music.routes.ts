import { Router } from "express";
import { listMusicLibrary, streamMusicFile } from "../controllers/music.controller.js";

const router = Router();

router.get("/api/music", listMusicLibrary);
router.get("/api/music/:id/file", streamMusicFile);

export default router;
