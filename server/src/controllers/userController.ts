import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

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
