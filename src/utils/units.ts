/**
 * Conversión de unidades de peso.
 *
 * REGLA CANÓNICA: el backend SIEMPRE almacena y devuelve los pesos en **kg**.
 * La unidad del usuario (`session.user.unit`) es solo de presentación/entrada:
 *  - al **mostrar** un peso → `fromKg`/`formatWeight` (kg → unidad del usuario).
 *  - al **enviar** un peso   → `toKg` (unidad del usuario → kg).
 * Para no acumular error de redondeo, nunca guardamos el valor convertido:
 * solo convertimos en el borde (entrada/salida de la UI).
 */

/** Unidad de peso soportada por la app. */
export type WeightUnit = "kg" | "lb";

/** Factor exacto: 1 lb = 0.45359237 kg. */
export const KG_PER_LB = 0.45359237;

/** Etiqueta corta de la unidad (sufijo mostrado junto al valor). */
export function unitLabel(unit: WeightUnit): string {
  return unit === "lb" ? "lb" : "kg";
}

/** Convierte un valor en la unidad del usuario a kg (para enviar al backend). */
export function toKg(value: number, unit: WeightUnit): number {
  return unit === "lb" ? value * KG_PER_LB : value;
}

/** Convierte un peso en kg (backend) a la unidad del usuario (para mostrar/editar). */
export function fromKg(kg: number, unit: WeightUnit): number {
  return unit === "lb" ? kg / KG_PER_LB : kg;
}

/** Redondea a 1 decimal (evita "4.500000001"). */
export function roundWeight(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Formatea un peso almacenado en kg a la unidad del usuario, con 1 decimal y
 * sufijo. Ej: formatWeight(50, "lb") → "110.2 lb".
 */
export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${roundWeight(fromKg(kg, unit))} ${unitLabel(unit)}`;
}
