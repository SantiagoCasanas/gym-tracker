import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Role } from "../lib/roles";

const CATEGORIES = ["superior", "inferior", "core", "cardio", "otros"] as const;
type Category = (typeof CATEGORIES)[number];

function isValidCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

// GET /sections — global defaults + user's own custom sections, defaults first.
// Each row carries `category`, `isDefault`, `userId` (null ⇒ global) plus a
// `scope` flag so the frontend can group "Generales" vs "Mías".
export async function listSections(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const sections = await prisma.bodySection.findMany({
    where: {
      OR: [{ userId: null }, { userId }],
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
  res.json(
    sections.map((s) => ({
      ...s,
      scope: s.userId === null ? "global" : "own",
    }))
  );
}

// POST /sections {name, category}
// ADMIN → global section (userId: null). MEMBER → private section (userId).
export async function createSection(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { name, category } = req.body ?? {};

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name es requerido" });
    return;
  }

  const rawCategory =
    category === undefined || category === null || category === ""
      ? "otros"
      : category;
  if (!isValidCategory(rawCategory)) {
    res.status(400).json({
      error: `category inválida. Valores permitidos: ${CATEGORIES.join(", ")}`,
    });
    return;
  }
  const cat: Category = rawCategory;

  const isAdmin = user.role === Role.ADMIN;

  const section = await prisma.bodySection.create({
    data: {
      name: name.trim(),
      category: cat,
      isDefault: false,
      userId: isAdmin ? null : user.id,
    },
  });
  res.status(201).json({
    ...section,
    scope: section.userId === null ? "global" : "own",
  });
}

// PUT /sections/:id {name?, category?}
// ADMIN edits global sections; MEMBER edits only their own (403 otherwise).
export async function updateSection(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;
  const { name, category } = req.body ?? {};

  const section = await prisma.bodySection.findUnique({ where: { id } });
  if (!section) {
    res.status(404).json({ error: "Sección no encontrada" });
    return;
  }

  const isAdmin = user.role === Role.ADMIN;
  const isGlobal = section.userId === null;

  // A member may only edit their own sections; global ones are admin-only.
  if (isGlobal ? !isAdmin : section.userId !== user.id) {
    res.status(403).json({ error: "No puedes editar esta sección" });
    return;
  }

  const data: { name?: string; category?: Category } = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "name no puede estar vacío" });
      return;
    }
    data.name = name.trim();
  }

  if (category !== undefined) {
    if (!isValidCategory(category)) {
      res.status(400).json({
        error: `category inválida. Valores permitidos: ${CATEGORIES.join(", ")}`,
      });
      return;
    }
    data.category = category;
  }

  const updated = await prisma.bodySection.update({ where: { id }, data });
  res.json({
    ...updated,
    scope: updated.userId === null ? "global" : "own",
  });
}

// DELETE /sections/:id
// ADMIN deletes global sections except seeded defaults (isDefault ⇒ 403).
// MEMBER deletes only their own sections.
export async function deleteSection(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;

  const section = await prisma.bodySection.findUnique({ where: { id } });
  if (!section) {
    res.status(404).json({ error: "Sección no encontrada" });
    return;
  }

  const isAdmin = user.role === Role.ADMIN;
  const isGlobal = section.userId === null;

  if (isGlobal) {
    if (!isAdmin) {
      res.status(403).json({ error: "No puedes eliminar esta sección" });
      return;
    }
    if (section.isDefault) {
      res
        .status(403)
        .json({ error: "No puedes eliminar una sección predeterminada" });
      return;
    }
  } else if (section.userId !== user.id) {
    res.status(403).json({ error: "No puedes eliminar esta sección" });
    return;
  }

  await prisma.bodySection.delete({ where: { id } });
  res.json({ ok: true });
}
