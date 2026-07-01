import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// GET /bodyweight — desc
export async function listBodyWeight(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const logs = await prisma.bodyWeightLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
  res.json(logs);
}

// POST /bodyweight {weight}
export async function createBodyWeight(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const weight = Number(req.body?.weight);
  if (!Number.isFinite(weight) || weight <= 0) {
    res.status(400).json({ error: "weight inválido" });
    return;
  }
  const log = await prisma.bodyWeightLog.create({ data: { userId, weight } });
  res.status(201).json(log);
}

// DELETE /bodyweight/:id
export async function deleteBodyWeight(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params;
  const log = await prisma.bodyWeightLog.findUnique({ where: { id } });
  if (!log || log.userId !== userId) {
    res.status(404).json({ error: "Registro no encontrado" });
    return;
  }
  await prisma.bodyWeightLog.delete({ where: { id } });
  res.json({ ok: true });
}
