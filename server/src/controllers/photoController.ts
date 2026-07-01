import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// GET /photos/:id (public) → raw image bytes with its Content-Type.
export async function getPhoto(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) {
    res.status(404).json({ error: "Foto no encontrada" });
    return;
  }
  res.set("Content-Type", photo.mimeType);
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.send(Buffer.from(photo.data));
}
