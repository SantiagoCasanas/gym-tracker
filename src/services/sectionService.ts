import { apiFetch } from "../api/client";
import type { BodySection, SectionCategory } from "models/index";

/**
 * Gestión de secciones corporales contra la API.
 * El servidor devuelve las globales (creadas por el admin) + las propias del
 * usuario del token, cada una con su `category` y `scope` ("global" | "own").
 * No se pasa userId: el aislamiento por usuario lo aplica el backend.
 */
export const sectionService = {
  /** Lista las secciones visibles (globales + propias del usuario). */
  async list(): Promise<BodySection[]> {
    return apiFetch<BodySection[]>("/sections");
  },

  /**
   * Crea una sección. Si el usuario es ADMIN la crea global (visible a todos);
   * si es MEMBER la crea privada. Requiere una categoría válida.
   */
  async create(name: string, category: SectionCategory): Promise<BodySection> {
    return apiFetch<BodySection>("/sections", { json: { name, category } });
  },

  /** Actualiza nombre y/o categoría de una sección. */
  async update(
    id: string,
    changes: { name?: string; category?: SectionCategory }
  ): Promise<BodySection> {
    return apiFetch<BodySection>(`/sections/${encodeURIComponent(id)}`, {
      method: "PUT",
      json: changes,
    });
  },

  /** Elimina una sección por id (admin: globales; usuario: las suyas). */
  async remove(id: string): Promise<void> {
    await apiFetch(`/sections/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};
