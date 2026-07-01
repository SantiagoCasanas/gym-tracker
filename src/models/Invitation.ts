import type { UserRole } from "./User";

/** Estado de una invitación (calculado por el servidor). */
export type InvitationStatus = "pendiente" | "aceptada" | "expirada";

/** Invitación creada por un admin para dar de alta a un nuevo usuario. */
export interface Invitation {
  id: string;
  email: string;
  token: string;
  role: UserRole;
  status: InvitationStatus;
  /** Enlace de aceptación listo para compartir (`/accept?token=...`). */
  inviteUrl: string;
  expiresAt: string;
  createdAt: string;
}

/** Respuesta de `POST /invitations`: la invitación + link de respaldo + flag de correo. */
export interface CreateInvitationResult {
  invitation: Invitation;
  inviteUrl: string;
  emailSent: boolean;
}
