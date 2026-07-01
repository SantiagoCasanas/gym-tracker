import { apiFetch, apiUpload } from "../api/client";
import type { User } from "models/index";

/** Respuesta de login / aceptación de invitación: token + usuario. */
export interface AuthResult {
  token: string;
  user: User;
}

/** Datos editables del propio perfil (`PUT /auth/profile`). */
export interface ProfileUpdate {
  name?: string;
  age?: number | null;
  gender?: string | null;
}

/** Autenticación y gestión del propio perfil contra la API. */
export const authService = {
  /** Inicia sesión con email + contraseña. Devuelve token y usuario. */
  async login(email: string, password: string): Promise<AuthResult> {
    return apiFetch<AuthResult>("/auth/login", {
      json: { email, password },
      skipAuth: true,
    });
  },

  /**
   * Inicia sesión con un idToken de Google (Google Identity Services).
   * Devuelve el mismo shape que `login`. Errores del backend:
   * 401 (token inválido), 403 (email no invitado), 503 (Google no configurado).
   */
  async google(idToken: string): Promise<AuthResult> {
    return apiFetch<AuthResult>("/auth/google", {
      json: { idToken },
      skipAuth: true,
    });
  },

  /** Usuario actual a partir del token. La API lo envuelve en `{ user }`. */
  async me(): Promise<User> {
    const res = await apiFetch<{ user: User }>("/auth/me");
    return res.user;
  },

  /** Actualiza nombre / edad / género del propio perfil. Devuelve el usuario. */
  async updateProfile(update: ProfileUpdate): Promise<User> {
    const res = await apiFetch<{ user: User }>("/auth/profile", {
      method: "PUT",
      json: update,
    });
    return res.user;
  },

  /** Sube el avatar del propio perfil (multipart `photo`). Devuelve el usuario. */
  async updateAvatar(photo: Blob): Promise<User> {
    const form = new FormData();
    form.append("photo", photo);
    const res = await apiUpload<{ user: User }>("/auth/avatar", form, {
      method: "PUT",
    });
    return res.user;
  },

  /** Cambia la propia contraseña (valida la actual; 401 si es incorrecta). */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await apiFetch<{ ok: true }>("/auth/password", {
      method: "PUT",
      json: { currentPassword, newPassword },
    });
  },
};
