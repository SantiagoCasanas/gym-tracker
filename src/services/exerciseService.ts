import { apiFetch, apiUpload } from "../api/client";
import type { Exercise } from "models/index";

/** Gestión de ejercicios por sección, incluida la foto de máquina (multipart). */
export const exerciseService = {
  /** Lista los ejercicios del usuario en una sección. */
  async listBySection(sectionId: string): Promise<Exercise[]> {
    return apiFetch<Exercise[]>(`/sections/${sectionId}/exercises`);
  },

  /**
   * Crea un ejercicio en una sección. Si se pasa un File/Blob, sube la foto
   * como multipart (`name` + `photo`).
   */
  async create(
    sectionId: string,
    name: string,
    photo?: Blob
  ): Promise<Exercise> {
    const form = new FormData();
    form.append("name", name);
    if (photo) form.append("photo", photo, "photo.jpg");
    return apiUpload<Exercise>(`/sections/${sectionId}/exercises`, form);
  },

  /** Devuelve un ejercicio por id. */
  async get(id: string): Promise<Exercise> {
    return apiFetch<Exercise>(`/exercises/${id}`);
  },

  /** Elimina un ejercicio (y su foto en el servidor). */
  async remove(id: string): Promise<void> {
    await apiFetch(`/exercises/${id}`, { method: "DELETE" });
  },

  /** Reemplaza la foto de un ejercicio (multipart `photo`). */
  async setPhoto(id: string, photo: Blob): Promise<Exercise> {
    const form = new FormData();
    form.append("photo", photo, "photo.jpg");
    return apiUpload<Exercise>(`/exercises/${id}/photo`, form, { method: "PUT" });
  },
};
