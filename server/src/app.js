import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import stickerRoutes from "./routes/sticker.routes.js";
import messageRoutes from "./routes/message.routes.js";
import publicRoutes from "./routes/public.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { notFound, errorHandler } from "./middleware/error.js";

// Builds the Express app. Kept separate from index.js so tests can mount it
// without starting an HTTP server.
export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Allow only the client origin, and send cookies with cross-origin requests.
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    })
  );

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/stickers", stickerRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/admin", adminRoutes);
  // Public sticker endpoints live under /api/q/:code.
  app.use("/api/q", publicRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
