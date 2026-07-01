import { apiFetch } from "../api/client";
import type { BodySection } from "models/index";

/**
 * Gestión de secciones corporales contra la API.
 * El servidor devuelve los 6 defaults globales primero + las custom del usuario
 * del token, y aplica el aislamiento por usuario. No se pasa userId.
 */
export const sectionService = {
  /** Lista las secciones visibles (defaults + custom del usuario). */
  async list(): Promise<BodySection[]> {
    return apiFetch<BodySection[]>("/sections");
  },

  /** Crea una sección custom para el usuario del token y la devuelve. */
  async create(name: string): Promise<BodySection> {
    return apiFetch<BodySection>("/sections", { json: { name } });
  },

  /** Elimina una sección custom por id. */
  async remove(id: string): Promise<void> {
    await apiFetch(`/sections/${id}`, { method: "DELETE" });
  },
};
