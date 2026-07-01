/** Registro de peso corporal del usuario en una fecha. */
export interface BodyWeightLog {
  id: string;
  userId: string;
  /** Fecha del registro en formato ISO string. */
  date: string;
  /** Peso corporal en kilogramos. */
  weight: number;
}
