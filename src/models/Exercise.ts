import type { Equipment } from "./Equipment";

/** Ejercicio de un usuario dentro de una sección corporal. Puede tener 1 foto de máquina. */
export interface Exercise {
  id: string;
  userId: string;
  sectionId: string;
  name: string;
  /** Equipamiento (subsección): maquina | mancuerna_barra | libre | otros. */
  equipment: Equipment;
  /** Ruta en disco de la foto en el servidor (o null si no tiene). */
  photoPath?: string | null;
  /** URL relativa de la foto (`/uploads/<archivo>`); anteponer la base URL para mostrarla. */
  photoUrl?: string | null;
  /** Fecha de creación en formato ISO string. */
  createdAt: string;
}
