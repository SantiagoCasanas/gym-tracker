import type { Equipment } from "./Equipment";

/** Resultado del buscador de ejercicios (`GET /exercises?q=`). Incluye la sección de origen. */
export interface ExerciseSearchResult {
  id: string;
  name: string;
  sectionId: string;
  sectionName: string;
  equipment: Equipment;
  photoUrl?: string | null;
}
