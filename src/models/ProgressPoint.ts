/** Punto agregado por día para la gráfica de progreso de un ejercicio. */
export interface ProgressPoint {
  /** Día (YYYY-MM-DD) del punto agregado. */
  date: string;
  /** Mejor (máximo) peso levantado ese día. */
  bestWeight: number;
  /** Máximo 1RM estimado (Epley) del día: weight * (1 + reps / 30). */
  estimated1RM: number;
}
