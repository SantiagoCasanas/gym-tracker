import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { Role } from "../lib/roles";
import { deletePhoto } from "../lib/photos";

// GET /users (admin) → [{ id, email, name, role, createdAt }]
export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
  res.json(users);
}

// PUT /users/:id/password (admin) { newPassword }
export async function adminResetPassword(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const { newPassword } = req.body ?? {};

  if (!newPassword) {
    res.status(400).json({ error: "newPassword es requerido" });
    return;
  }

  if (String(newPassword).length < 6) {
    res
      .status(400)
      .json({ error: "newPassword debe tener al menos 6 caracteres" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  const passwordHash = await bcrypt.hash(String(newPassword), 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  res.json({ ok: true });
}

// DELETE /users/:id (admin) — removes the user and all of their data.
// Most children cascade via the schema (sections, exercises, sets, bodyweight;
// invitations sent by this user become invitedById = null via SetNull). Photos
// (avatar + exercise photos) do NOT cascade, so they are deleted explicitly.
export async function deleteUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const requester = req.user!;

  if (id === requester.id) {
    res.status(400).json({ error: "No puedes eliminarte a ti mismo" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  // Guard: never remove the last remaining ADMIN.
  if (user.role === Role.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
    if (adminCount <= 1) {
      res
        .status(400)
        .json({ error: "No puedes eliminar al último administrador" });
      return;
    }
  }

  // Collect photo ids to purge (Photo rows never cascade from User/Exercise).
  const exercisePhotos = await prisma.exercise.findMany({
    where: { userId: id, photoId: { not: null } },
    select: { photoId: true },
  });
  const photoIds = exercisePhotos
    .map((e) => e.photoId)
    .filter((p): p is string => p !== null);
  if (user.avatarId) photoIds.push(user.avatarId);

  // Deleting the user cascades its sections/exercises/sets/bodyweight and
  // nulls out invitedById on invitations it created.
  await prisma.user.delete({ where: { id } });

  // Best-effort photo cleanup (deletePhoto never throws).
  for (const photoId of photoIds) {
    await deletePhoto(photoId);
  }

  res.json({ ok: true });
}
