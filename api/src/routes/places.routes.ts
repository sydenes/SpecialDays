import { Router } from "express";
import { reversePlace, searchPlaces } from "../controllers/places.controller.js";

const router = Router();

router.get("/api/places/search", searchPlaces);
router.get("/api/places/reverse", reversePlace);

export default router;
