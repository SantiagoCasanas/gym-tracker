import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";
import { Role } from "../lib/roles";
import { serializeUser } from "../lib/userSerializer";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  unit: string;
  age: number | null;
  gender: string | null;
  avatarUrl: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface JwtPayload {
  sub: string;
  role: string;
}

export function signToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, env.JWT_SECRET, { expiresIn: "30d" });
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      res.status(401).json({ error: "Usuario no encontrado" });
      return;
    }
    req.user = serializeUser(user);
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  if (req.user.role !== Role.ADMIN) {
    res.status(403).json({ error: "Requiere rol de administrador" });
    return;
  }
  next();
}
