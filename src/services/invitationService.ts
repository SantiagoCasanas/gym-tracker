import { apiFetch } from "../api/client";
import type {
  CreateInvitationResult,
  Invitation,
  UserRole,
} from "models/index";
import type { AuthResult } from "./authService";

/** Validación pública de un token de invitación. */
export interface InvitationCheck {
  email?: string;
  valid: boolean;
}

/** Gestión de invitaciones (admin) y flujo público de aceptación. */
export const invitationService = {
  /** Crea una invitación (admin). Devuelve la invitación, el link y si se envió correo. */
  async create(email: string, role: UserRole): Promise<CreateInvitationResult> {
    return apiFetch<CreateInvitationResult>("/invitations", {
      json: { email, role },
    });
  },

  /** Lista todas las invitaciones (admin) con su estado calculado. */
  async list(): Promise<Invitation[]> {
    return apiFetch<Invitation[]>("/invitations");
  },

  /**
   * Reenvía una invitación (admin). Renueva su vigencia y reintenta el correo.
   * Devuelve la invitación actualizada, el link de respaldo y si se envió correo.
   */
  async resend(id: string): Promise<CreateInvitationResult> {
    return apiFetch<CreateInvitationResult>(
      `/invitations/${encodeURIComponent(id)}/resend`,
      { method: "POST" }
    );
  },

  /** Valida un token de invitación (público, sin auth). */
  async check(token: string): Promise<InvitationCheck> {
    return apiFetch<InvitationCheck>(
      `/invitations/${encodeURIComponent(token)}`,
      { skipAuth: true }
    );
  },

  /** Acepta una invitación fijando nombre + contraseña. Auto-login (token + user). */
  async accept(
    token: string,
    name: string,
    password: string
  ): Promise<AuthResult> {
    return apiFetch<AuthResult>(
      `/invitations/${encodeURIComponent(token)}/accept`,
      { json: { name, password }, skipAuth: true }
    );
  },
};
