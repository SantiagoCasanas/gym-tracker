import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { normalizeRole } from "../lib/roles";
import { sendInvite } from "../lib/mailer";
import { signToken } from "../middleware/auth";
import { env } from "../lib/env";

const INVITE_TTL_DAYS = 7;

function inviteStatus(inv: {
  acceptedAt: Date | null;
  expiresAt: Date;
}): "pendiente" | "aceptada" | "expirada" {
  if (inv.acceptedAt) return "aceptada";
  if (inv.expiresAt.getTime() < Date.now()) return "expirada";
  return "pendiente";
}

// POST /invitations (admin)
export async function createInvitation(req: Request, res: Response): Promise<void> {
  const { email, role } = req.body ?? {};
  if (!email) {
    res.status(400).json({ error: "email es requerido" });
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(409).json({ error: "Ya existe un usuario con ese email" });
    return;
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const invitation = await prisma.invitation.create({
    data: {
      email,
      token,
      role: normalizeRole(role),
      invitedById: req.user!.id,
      expiresAt,
    },
  });

  const inviteUrl = `${env.APP_URL}/accept?token=${token}`;

  // Non-blocking: email failure must not fail the request.
  let emailSent = false;
  try {
    emailSent = await sendInvite(email, inviteUrl);
  } catch (err) {
    console.error("[invitations] sendInvite threw:", err);
    emailSent = false;
  }

  res.status(201).json({
    invitation: { ...invitation, status: inviteStatus(invitation) },
    inviteUrl,
    emailSent,
  });
}

// POST /invitations/:id/resend (admin)
export async function resendInvitation(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const inv = await prisma.invitation.findUnique({ where: { id } });
  if (!inv) {
    res.status(404).json({ error: "Invitación no encontrada" });
    return;
  }

  if (inv.acceptedAt) {
    res.status(400).json({ error: "La invitación ya fue aceptada" });
    return;
  }

  // Refresh validity so an old/expired invite becomes valid again with the same token.
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  const invitation = await prisma.invitation.update({
    where: { id: inv.id },
    data: { expiresAt },
  });

  const inviteUrl = `${env.APP_URL}/accept?token=${invitation.token}`;

  // Non-blocking: email failure must not fail the request.
  let emailSent = false;
  try {
    emailSent = await sendInvite(invitation.email, inviteUrl);
  } catch (err) {
    console.error("[invitations] sendInvite threw:", err);
    emailSent = false;
  }

  res.status(200).json({
    invitation: { ...invitation, status: inviteStatus(invitation) },
    inviteUrl,
    emailSent,
  });
}

// GET /invitations (admin)
export async function listInvitations(_req: Request, res: Response): Promise<void> {
  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(
    invitations.map((inv) => ({
      ...inv,
      status: inviteStatus(inv),
      inviteUrl: `${env.APP_URL}/accept?token=${inv.token}`,
    }))
  );
}

// GET /invitations/:token (public)
export async function getInvitation(req: Request, res: Response): Promise<void> {
  const { token } = req.params;
  const inv = await prisma.invitation.findUnique({ where: { token } });

  if (!inv || inv.acceptedAt || inv.expiresAt.getTime() < Date.now()) {
    res.json({ valid: false });
    return;
  }
  res.json({ email: inv.email, valid: true });
}

// POST /invitations/:token/accept (public)
export async function acceptInvitation(req: Request, res: Response): Promise<void> {
  const { token } = req.params;
  const { name, password } = req.body ?? {};

  if (!name || !password) {
    res.status(400).json({ error: "name y password son requeridos" });
    return;
  }

  const inv = await prisma.invitation.findUnique({ where: { token } });
  if (!inv || inv.acceptedAt || inv.expiresAt.getTime() < Date.now()) {
    res.status(400).json({ error: "Invitación inválida o expirada" });
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { email: inv.email } });
  if (existingUser) {
    res.status(409).json({ error: "El usuario ya existe" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: inv.email,
        name,
        passwordHash,
        role: inv.role, // usually MEMBER
      },
    });
    await tx.invitation.update({
      where: { id: inv.id },
      data: { acceptedAt: new Date() },
    });
    return created;
  });

  const authToken = signToken(user.id, user.role);
  res.status(201).json({
    token: authToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
