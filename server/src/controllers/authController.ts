import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma";
import { signToken } from "../middleware/auth";
import { serializeUser } from "../lib/userSerializer";
import { savePhoto, deletePhoto } from "../lib/photos";
import { env } from "../lib/env";

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

  // Google-only accounts have no password set; they cannot log in with one.
  if (!user.passwordHash) {
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

// Reused across calls; verifyIdToken performs its own network fetch for certs.
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// POST /auth/google (public) { idToken }
// Login with Google, restricted to already-invited/existing users.
export async function googleLogin(req: Request, res: Response): Promise<void> {
  const { idToken } = req.body ?? {};

  if (!env.GOOGLE_CLIENT_ID) {
    res.status(503).json({ error: "Google login no configurado" });
    return;
  }

  if (!idToken || typeof idToken !== "string") {
    res.status(400).json({ error: "idToken es requerido" });
    return;
  }

  // Verify the token signature + audience against Google's public certs.
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    res.status(401).json({ error: "Token de Google inválido" });
    return;
  }

  if (!payload || !payload.email) {
    res.status(401).json({ error: "Token de Google inválido" });
    return;
  }

  if (payload.email_verified !== true) {
    res.status(401).json({ error: "El correo de Google no está verificado" });
    return;
  }

  const email = payload.email.toLowerCase();

  // Existing user → just log them in.
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existing) {
    const token = signToken(existing.id, existing.role);
    res.json({ token, user: serializeUser(existing) });
    return;
  }

  // No user yet → must have a pending, non-expired invitation.
  const invitation = await prisma.invitation.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!invitation) {
    res.status(403).json({
      error: "No estás invitado. Pide al administrador que te invite.",
    });
    return;
  }

  // Create a Google-only MEMBER user (no passwordHash) and consume the invite.
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        name: payload!.name || email,
        role: invitation.role, // usually MEMBER
      },
    });
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
    return created;
  });

  const token = signToken(user.id, user.role);
  res.status(201).json({ token, user: serializeUser(user) });
}

export async function me(req: Request, res: Response): Promise<void> {
  // requireAuth already loaded req.user (already serialized)
  res.json({ user: req.user });
}

// PUT /auth/profile (requireAuth) { name?, age?, gender?, unit? }
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { name, age, gender, unit } = req.body ?? {};

  const data: {
    name?: string;
    age?: number | null;
    gender?: string | null;
    unit?: string;
  } = {};

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

  // Weight display unit. Weights stay stored in kg; this is only a display pref.
  // Design choice: an explicitly-provided invalid value is a 400 (consistent
  // with the other fields above); omitting `unit` leaves it unchanged.
  if (unit !== undefined) {
    if (unit !== "kg" && unit !== "lb") {
      res.status(400).json({ error: "unit debe ser kg o lb" });
      return;
    }
    data.unit = unit;
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

  // Accounts without a password (e.g. Google-only) can't verify a current one.
  if (!user.passwordHash) {
    res
      .status(400)
      .json({ error: "Esta cuenta no tiene contraseña configurada" });
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
