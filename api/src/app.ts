import express from "express";
import cors from "cors";
import { join, resolve } from "node:path";

import authRoutes from "./routes/auth.routes.js";
import pagesRoutes from "./routes/pages.routes.js";
import publicApiRoutes from "./routes/publicApi.routes.js";
import dashboardTemplatesRoutes from "./routes/dashboardTemplates.routes.js";
import dashboardPagesRoutes from "./routes/dashboardPages.routes.js";
import mePagesRoutes from "./routes/mePages.routes.js";
import ogRoutes from "./routes/og.routes.js";
import { ogSpaFallback } from "./middleware/ogSpaFallback.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("/{*path}", cors());

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(publicApiRoutes);
app.use(ogRoutes);
app.use(authRoutes);
app.use(mePagesRoutes);
app.use(pagesRoutes);
app.use(dashboardTemplatesRoutes);
app.use(dashboardPagesRoutes);

if (env.UI_DIST_PATH) {
  const uiDist = resolve(process.cwd(), env.UI_DIST_PATH);
  app.get("/:slug", ogSpaFallback);
  app.use(express.static(uiDist));
  // Express 5 / path-to-regexp v8: bare "*" invalid — named wildcard required
  app.get("/{*path}", (_req, res) => {
    res.sendFile(join(uiDist, "index.html"));
  });
}

app.use(errorHandler);
