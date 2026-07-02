/** Equipamiento de un ejercicio (subsección dentro de la sección corporal). */
export type Equipment = "maquina" | "mancuerna_barra" | "libre" | "otros";

/** Orden en que se muestran los grupos de equipamiento. */
export const EQUIPMENT_ORDER: Equipment[] = [
  "maquina",
  "mancuerna_barra",
  "libre",
  "otros",
];

/** Etiquetas legibles por valor de equipamiento. */
export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  maquina: "Máquina",
  mancuerna_barra: "Mancuerna / Barra",
  libre: "Libre",
  otros: "Otros",
};

/** Opciones para selects (value + label), en el orden canónico. */
export const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] =
  EQUIPMENT_ORDER.map((value) => ({ value, label: EQUIPMENT_LABELS[value] }));

/** Normaliza un valor crudo del backend a un Equipment válido (fallback "otros"). */
export function toEquipment(value: unknown): Equipment {
  return value === "maquina" ||
    value === "mancuerna_barra" ||
    value === "libre" ||
    value === "otros"
    ? value
    : "otros";
}
