import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Root dizindeki .env dosyasini oku.
dotenv.config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

export const env = {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
};

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL bulunamadi. Root dizinde .env olustur.");
}

