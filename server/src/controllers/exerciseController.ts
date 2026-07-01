import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { photoUrl, savePhoto, deletePhoto } from "../lib/photos";

function serializeExercise(e: {
  id: string;
  userId: string;
  sectionId: string;
  name: string;
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

// POST /sections/:sectionId/exercises (multipart: name + photo?)
export async function createExercise(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { sectionId } = req.params;
  const name = (req.body?.name ?? "").toString().trim();
  const file = req.file;

  if (!name) {
    res.status(400).json({ error: "name es requerido" });
    return;
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
      photoId,
    },
  });
  res.status(201).json(serializeExercise(exercise));
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
