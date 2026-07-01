import { apiFetch } from "../api/client";
import type { BodyWeightLog } from "models/index";

/** Punto de la serie temporal de peso corporal para graficar. */
export interface BodyWeightPoint {
  date: string;
  weight: number;
}

/** Registro y consulta de peso corporal del usuario del token (vía API). */
export const bodyWeightService = {
  /** Añade un registro de peso corporal y lo devuelve. */
  async add(weight: number): Promise<BodyWeightLog> {
    return apiFetch<BodyWeightLog>("/bodyweight", { json: { weight } });
  },

  /** Lista los registros del usuario (fecha desc, tal como los devuelve la API). */
  async list(): Promise<BodyWeightLog[]> {
    return apiFetch<BodyWeightLog[]>("/bodyweight");
  },

  /** Elimina un registro por id. */
  async remove(id: string): Promise<void> {
    await apiFetch(`/bodyweight/${id}`, { method: "DELETE" });
  },

  /** Serie temporal {date, weight} ascendente por fecha para graficar. */
  async series(): Promise<BodyWeightPoint[]> {
    const logs = await this.list();
    return logs
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((log) => ({ date: log.date, weight: log.weight }));
  },
};
