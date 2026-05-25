import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import pagesRoutes from "./routes/pages.routes.js";
import publicApiRoutes from "./routes/publicApi.routes.js";
import dashboardTemplatesRoutes from "./routes/dashboardTemplates.routes.js";
import dashboardPagesRoutes from "./routes/dashboardPages.routes.js";
import mePagesRoutes from "./routes/mePages.routes.js";
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
app.use(authRoutes);
app.use(mePagesRoutes);
app.use(pagesRoutes);
app.use(dashboardTemplatesRoutes);
app.use(dashboardPagesRoutes);

app.use(errorHandler);

