import express from "express";
import { login, me, register } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/api/auth/register", register);
router.post("/api/auth/login", login);
router.get("/api/auth/me", requireAuth, me);

export default router;
