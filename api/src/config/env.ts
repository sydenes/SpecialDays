import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Root dizindeki .env dosyasini oku.
dotenv.config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

export const env = {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || "e2dfc61d08a12810e884361c38e73a1a02e17d8ab6ee8478c908ae5c97289e6b",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  /** Paylaşılan sayfa URL kökü (og:url) */
  PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL || "http://localhost:5173",
  /** og:image ve API foto mutlak adresi */
  PUBLIC_API_URL: process.env.PUBLIC_API_URL || "http://localhost:4000",
  /** Production: ui/dist yolu — crawler OG + SPA servisi */
  UI_DIST_PATH: process.env.UI_DIST_PATH || "",
};

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL bulunamadi. Root dizinde .env olustur.");
}

