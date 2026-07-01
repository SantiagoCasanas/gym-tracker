/** Rol del usuario en la plataforma. */
export type UserRole = "ADMIN" | "MEMBER";

/** Usuario autenticado (devuelto por `/auth/login` y `/auth/me`). */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Edad (opcional; null si no se ha completado). */
  age: number | null;
  /** Género (opcional; null si no se ha completado). */
  gender: string | null;
  /** URL relativa del avatar en el servidor (`/uploads/...`) o null. */
  avatarUrl: string | null;
}

/** Usuario en el listado de administración (`GET /users`). */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}
