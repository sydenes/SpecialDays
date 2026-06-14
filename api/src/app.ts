import express from "express";
import cors from "cors";
import { join } from "node:path";

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
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
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
  app.get("/:slug", ogSpaFallback);
  app.use(express.static(env.UI_DIST_PATH));
  app.get("*", (_req, res) => {
    res.sendFile(join(env.UI_DIST_PATH, "index.html"));
  });
}

app.use(errorHandler);

