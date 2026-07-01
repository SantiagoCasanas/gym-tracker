import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// GET /sections — global defaults + user's custom sections, defaults first.
export async function listSections(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const sections = await prisma.bodySection.findMany({
    where: {
      OR: [{ isDefault: true, userId: null }, { userId }],
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
  res.json(sections);
}

// POST /sections {name} — custom section owned by the user.
export async function createSection(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { name } = req.body ?? {};
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name es requerido" });
    return;
  }
  const section = await prisma.bodySection.create({
    data: { name: name.trim(), isDefault: false, userId },
  });
  res.status(201).json(section);
}

// DELETE /sections/:id — only the user's own custom sections.
export async function deleteSection(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params;

  const section = await prisma.bodySection.findUnique({ where: { id } });
  if (!section) {
    res.status(404).json({ error: "Sección no encontrada" });
    return;
  }
  if (section.isDefault || section.userId !== userId) {
    res.status(403).json({ error: "No puedes eliminar esta sección" });
    return;
  }

  await prisma.bodySection.delete({ where: { id } });
  res.json({ ok: true });
}
