import { apiFetch } from "../api/client";
import type { AdminUser } from "models/index";

/** Gestión de usuarios y contraseñas por parte de un administrador. */
export const userService = {
  /** Lista todos los usuarios de la plataforma (solo ADMIN). */
  async list(): Promise<AdminUser[]> {
    return apiFetch<AdminUser[]>("/users");
  },

  /** Resetea la contraseña de un usuario cualquiera (solo ADMIN). */
  async setPassword(id: string, newPassword: string): Promise<void> {
    await apiFetch<{ ok: true }>(
      `/users/${encodeURIComponent(id)}/password`,
      { method: "PUT", json: { newPassword } }
    );
  },
};
