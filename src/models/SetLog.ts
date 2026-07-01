/** Registro de una serie: peso (kg) y repeticiones para un ejercicio en una fecha. */
export interface SetLog {
  id: string;
  userId: string;
  exerciseId: string;
  /** Fecha del registro en formato ISO string. */
  date: string;
  /** Peso en kilogramos. */
  weight: number;
  /** Repeticiones. */
  reps: number;
}
