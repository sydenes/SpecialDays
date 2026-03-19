import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET /api/pages/:slug -> return page data for special URL
app.get("/api/pages/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    const { rows } = await pool.query(
      "SELECT slug, template_id AS \"templateId\", title, event_date AS \"eventDate\", main_text AS \"mainText\" FROM special_pages WHERE slug = $1",
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Page not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching page by slug", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

