import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Root dizindeki .env dosyasini oku.
dotenv.config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

export const env = {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || "dev-change-me-specialdays-jwt-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
};

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL bulunamadi. Root dizinde .env olustur.");
}

if (process.env.NODE_ENV === "production" && env.JWT_SECRET.startsWith("dev-change-me")) {
  throw new Error("Production icin JWT_SECRET .env dosyasinda ayarlanmali.");
}

