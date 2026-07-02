import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { photoUrl, savePhoto, deletePhoto } from "../lib/photos";

// Allowed equipment classifications. Anything else is rejected with 400.
const EQUIPMENT_VALUES = ["maquina", "mancuerna_barra", "libre", "otros"] as const;
type Equipment = (typeof EQUIPMENT_VALUES)[number];

function isValidEquipment(value: unknown): value is Equipment {
  return typeof value === "string" && (EQUIPMENT_VALUES as readonly string[]).includes(value);
}

function serializeExercise(e: {
  id: string;
  userId: string;
  sectionId: string;
  name: string;
  equipment: string;
  photoId: string | null;
  createdAt: Date;
}) {
  return { ...e, photoUrl: photoUrl(e.photoId) };
}

// GET /sections/:sectionId/exercises
export async function listExercises(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { sectionId } = req.params;

  // Section must be visible to the user (default or owned).
  const section = await prisma.bodySection.findUnique({ where: { id: sectionId } });
  if (!section || (!section.isDefault && section.userId !== userId)) {
    res.status(404).json({ error: "Sección no encontrada" });
    return;
  }

  const exercises = await prisma.exercise.findMany({
    where: { sectionId, userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(exercises.map(serializeExercise));
}

// GET /exercises?q=...  (search by word match in the exercise name)
// Tokenizes q by whitespace; ALL words must appear (AND), case-insensitive.
// Empty q returns []. Only the caller's own exercises are searched.
export async function searchExercises(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const q = (req.query.q ?? "").toString().trim();

  if (!q) {
    res.json([]);
    return;
  }

  const words = q.split(/\s+/).filter(Boolean);
  const exercises = await prisma.exercise.findMany({
    where: {
      userId,
      AND: words.map((w) => ({
        name: { contains: w, mode: "insensitive" as const },
      })),
    },
    orderBy: { createdAt: "desc" },
    include: { section: { select: { name: true } } },
  });

  res.json(
    exercises.map((e) => ({
      id: e.id,
      name: e.name,
      sectionId: e.sectionId,
      sectionName: e.section.name,
      equipment: e.equipment,
      photoUrl: photoUrl(e.photoId),
    }))
  );
}

// POST /sections/:sectionId/exercises (multipart: name + equipment? + photo?)
export async function createExercise(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { sectionId } = req.params;
  const name = (req.body?.name ?? "").toString().trim();
  const file = req.file;

  if (!name) {
    res.status(400).json({ error: "name es requerido" });
    return;
  }

  // equipment is optional; if provided it must be valid, otherwise default to "otros".
  let equipment: Equipment = "otros";
  if (req.body?.equipment !== undefined && req.body?.equipment !== "") {
    if (!isValidEquipment(req.body.equipment)) {
      res.status(400).json({ error: "equipment inválido" });
      return;
    }
    equipment = req.body.equipment;
  }

  const section = await prisma.bodySection.findUnique({ where: { id: sectionId } });
  if (!section || (!section.isDefault && section.userId !== userId)) {
    res.status(404).json({ error: "Sección no encontrada" });
    return;
  }

  const photoId = file ? await savePhoto(file) : null;

  const exercise = await prisma.exercise.create({
    data: {
      userId,
      sectionId,
      name,
      equipment,
      photoId,
    },
  });
  res.status(201).json(serializeExercise(exercise));
}

// PUT /exercises/:id  { name?, equipment? }  — rename and/or reclassify.
// Does NOT touch photo or sets. Returns the same shape as GET /exercises/:id.
export async function updateExercise(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params;

  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) {
    res.status(404).json({ error: "Ejercicio no encontrado" });
    return;
  }
  if (exercise.userId !== userId) {
    res.status(403).json({ error: "No autorizado" });
    return;
  }

  const data: { name?: string; equipment?: Equipment } = {};

  if (req.body?.name !== undefined) {
    const trimmed = String(req.body.name).trim();
    if (!trimmed) {
      res.status(400).json({ error: "name no puede estar vacío" });
      return;
    }
    data.name = trimmed;
  }

  if (req.body?.equipment !== undefined) {
    if (!isValidEquipment(req.body.equipment)) {
      res.status(400).json({ error: "equipment inválido" });
      return;
    }
    data.equipment = req.body.equipment;
  }

  const updated = await prisma.exercise.update({ where: { id }, data });
  res.json(serializeExercise(updated));
}

// GET /exercises/:id
export async function getExercise(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params;
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise || exercise.userId !== userId) {
    res.status(404).json({ error: "Ejercicio no encontrado" });
    return;
  }
  res.json(serializeExercise(exercise));
}

// DELETE /exercises/:id
export async function deleteExercise(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params;
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise || exercise.userId !== userId) {
    res.status(404).json({ error: "Ejercicio no encontrado" });
    return;
  }
  await prisma.exercise.delete({ where: { id } });
  await deletePhoto(exercise.photoId);
  res.json({ ok: true });
}

// PUT /exercises/:id/photo (multipart: photo)
export async function updateExercisePhoto(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "photo es requerido" });
    return;
  }

  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise || exercise.userId !== userId) {
    res.status(404).json({ error: "Ejercicio no encontrado" });
    return;
  }

  const oldPhotoId = exercise.photoId;
  const photoId = await savePhoto(file);
  const updated = await prisma.exercise.update({
    where: { id },
    data: { photoId },
  });
  await deletePhoto(oldPhotoId);
  res.json(serializeExercise(updated));
}
