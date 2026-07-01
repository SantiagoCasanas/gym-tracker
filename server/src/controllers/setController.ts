import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

async function ownExercise(userId: string, exerciseId: string) {
  const ex = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (!ex || ex.userId !== userId) return null;
  return ex;
}

// GET /exercises/:id/sets — date desc
export async function listSets(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params;
  const ex = await ownExercise(userId, id);
  if (!ex) {
    res.status(404).json({ error: "Ejercicio no encontrado" });
    return;
  }
  const sets = await prisma.setLog.findMany({
    where: { exerciseId: id, userId },
    orderBy: { date: "desc" },
  });
  res.json(sets);
}

// POST /exercises/:id/sets {weight, reps}
export async function createSet(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params;
  const weight = Number(req.body?.weight);
  const reps = Number(req.body?.reps);

  if (!Number.isFinite(weight) || weight < 0) {
    res.status(400).json({ error: "weight inválido" });
    return;
  }
  if (!Number.isInteger(reps) || reps <= 0) {
    res.status(400).json({ error: "reps inválido" });
    return;
  }

  const ex = await ownExercise(userId, id);
  if (!ex) {
    res.status(404).json({ error: "Ejercicio no encontrado" });
    return;
  }

  const set = await prisma.setLog.create({
    data: { userId, exerciseId: id, weight, reps },
  });
  res.status(201).json(set);
}

// DELETE /sets/:id
export async function deleteSet(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params;
  const set = await prisma.setLog.findUnique({ where: { id } });
  if (!set || set.userId !== userId) {
    res.status(404).json({ error: "Serie no encontrada" });
    return;
  }
  await prisma.setLog.delete({ where: { id } });
  res.json({ ok: true });
}

// GET /exercises/:id/progress → [{ date, bestWeight, estimated1RM }] asc, per day
export async function getProgress(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params;
  const ex = await ownExercise(userId, id);
  if (!ex) {
    res.status(404).json({ error: "Ejercicio no encontrado" });
    return;
  }

  const sets = await prisma.setLog.findMany({
    where: { exerciseId: id, userId },
    orderBy: { date: "asc" },
  });

  // Aggregate per calendar day (YYYY-MM-DD).
  const byDay = new Map<string, { bestWeight: number; estimated1RM: number }>();
  for (const s of sets) {
    const day = s.date.toISOString().slice(0, 10);
    const oneRM = s.weight * (1 + s.reps / 30); // Epley
    const cur = byDay.get(day);
    if (!cur) {
      byDay.set(day, { bestWeight: s.weight, estimated1RM: oneRM });
    } else {
      cur.bestWeight = Math.max(cur.bestWeight, s.weight);
      cur.estimated1RM = Math.max(cur.estimated1RM, oneRM);
    }
  }

  const progress = Array.from(byDay.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, v]) => ({
      date,
      bestWeight: v.bestWeight,
      estimated1RM: Math.round(v.estimated1RM * 100) / 100,
    }));

  res.json(progress);
}
