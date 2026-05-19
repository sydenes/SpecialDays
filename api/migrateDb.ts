import dotenv from "dotenv";
import { Pool } from "pg";
import { fileURLToPath } from "url";
import { migrateCategoriesAndAssignments } from "./src/db/migrations/categoriesAndAssignments.js";
import { migratePagePhotosInline } from "./src/db/migrations/pagePhotosInline.js";
import { migrateTemplateVariants } from "./src/db/migrations/templateVariants.js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL bulunamadi.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  try {
    console.log("Sadece migrasyonlar calisiyor...");
    await migratePagePhotosInline(pool);
    await migrateCategoriesAndAssignments(pool);
    await migrateTemplateVariants(pool);
    console.log("Migrasyonlar bitti.");
  } catch (err) {
    console.error("Migrasyon hatasi:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
