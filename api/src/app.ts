import express from "express";
import cors from "cors";

import pagesRoutes from "./routes/pages.routes.js";
import dashboardTemplatesRoutes from "./routes/dashboardTemplates.routes.js";
import dashboardPagesRoutes from "./routes/dashboardPages.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(pagesRoutes);
app.use(dashboardTemplatesRoutes);
app.use(dashboardPagesRoutes);

app.use(errorHandler);

