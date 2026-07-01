import { apiFetch } from "../api/client";
import type { SetLog, ProgressPoint } from "models/index";

/** Registro de series y consulta de progreso por ejercicio (vía API). */
export const setLogService = {
  /** Añade una serie (peso + reps) a un ejercicio y la devuelve. */
  async add(exerciseId: string, weight: number, reps: number): Promise<SetLog> {
    return apiFetch<SetLog>(`/exercises/${exerciseId}/sets`, {
      json: { weight, reps },
    });
  },

  /** Historial de series de un ejercicio (fecha desc, tal como lo devuelve la API). */
  async listByExercise(exerciseId: string): Promise<SetLog[]> {
    return apiFetch<SetLog[]>(`/exercises/${exerciseId}/sets`);
  },

  /** Elimina una serie por id. */
  async remove(id: string): Promise<void> {
    await apiFetch(`/sets/${id}`, { method: "DELETE" });
  },

  /**
   * Progreso agregado por día (asc). Lo calcula el servidor
   * (`GET /exercises/:id/progress`): bestWeight + estimated1RM Epley por día.
   */
  async progressByExercise(exerciseId: string): Promise<ProgressPoint[]> {
    return apiFetch<ProgressPoint[]>(`/exercises/${exerciseId}/progress`);
  },
};
