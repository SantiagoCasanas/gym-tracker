import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import { env } from "./lib/env";
import authRoutes from "./routes/authRoutes";
import invitationRoutes from "./routes/invitationRoutes";
import userRoutes from "./routes/userRoutes";
import domainRoutes from "./routes/domainRoutes";
import photoRoutes from "./routes/photoRoutes";

const app = express();

// Allowed CORS origins: CORS_ORIGIN (comma-separated) with fallback to
// APP_URL and the local dev frontend. Deduplicated, empty entries dropped.
const corsOrigins = Array.from(
  new Set(
    [...env.CORS_ORIGIN.split(","), env.APP_URL, "http://localhost:5180"]
      .map((o) => o.trim())
      .filter(Boolean)
  )
);

app.use(cors({ origin: corsOrigins, credentials: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health
app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Routers
app.use("/auth", authRoutes);
app.use("/invitations", invitationRoutes);
app.use("/users", userRoutes);
app.use("/photos", photoRoutes);
app.use("/", domainRoutes);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Central error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: `Error de subida: ${err.message}` });
    return;
  }
  if (err instanceof Error && err.message === "Solo se permiten imágenes") {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error("[error]", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : env.PORT || 4000;
app.listen(port, () => {
  console.log(`Gym Tracker API escuchando en http://localhost:${port}`);
});

export default app;
