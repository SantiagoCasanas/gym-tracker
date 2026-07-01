import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../middleware/auth";
import { serializeUser } from "../lib/userSerializer";
import { savePhoto, deletePhoto } from "../lib/photos";

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "email y password son requeridos" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const token = signToken(user.id, user.role);
  res.json({ token, user: serializeUser(user) });
}

export async function me(req: Request, res: Response): Promise<void> {
  // requireAuth already loaded req.user (already serialized)
  res.json({ user: req.user });
}

// PUT /auth/profile (requireAuth) { name?, age?, gender? }
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { name, age, gender } = req.body ?? {};

  const data: { name?: string; age?: number | null; gender?: string | null } = {};

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) {
      res.status(400).json({ error: "name no puede estar vacío" });
      return;
    }
    data.name = trimmed;
  }

  if (age !== undefined) {
    if (age === null || age === "") {
      data.age = null;
    } else {
      const n = Number(age);
      if (!Number.isInteger(n) || n < 0 || n > 120) {
        res.status(400).json({ error: "age debe ser un entero entre 0 y 120" });
        return;
      }
      data.age = n;
    }
  }

  if (gender !== undefined) {
    if (gender === null || gender === "") {
      data.gender = null;
    } else {
      const g = String(gender).trim();
      if (g.length > 40) {
        res.status(400).json({ error: "gender es demasiado largo" });
        return;
      }
      data.gender = g;
    }
  }

  const user = await prisma.user.update({ where: { id: userId }, data });
  res.json({ user: serializeUser(user) });
}

// PUT /auth/avatar (requireAuth, multipart field "photo")
export async function updateAvatar(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "photo es requerido" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  const oldAvatarId = existing.avatarId;
  const avatarId = await savePhoto(file);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarId },
  });
  await deletePhoto(oldAvatarId);
  res.json({ user: serializeUser(user) });
}

// PUT /auth/password (requireAuth) { currentPassword, newPassword }
export async function changePassword(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.body ?? {};

  if (!currentPassword || !newPassword) {
    res
      .status(400)
      .json({ error: "currentPassword y newPassword son requeridos" });
    return;
  }

  if (String(newPassword).length < 6) {
    res
      .status(400)
      .json({ error: "newPassword debe tener al menos 6 caracteres" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  const ok = await bcrypt.compare(String(currentPassword), user.passwordHash);
  if (!ok) {
    res.status(400).json({ error: "La contraseña actual es incorrecta" });
    return;
  }

  const passwordHash = await bcrypt.hash(String(newPassword), 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  res.json({ ok: true });
}
