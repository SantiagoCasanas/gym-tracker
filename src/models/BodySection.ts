/**
 * Sección corporal.
 * - Las globales las crea el ADMIN (`userId: null`, `scope: "global"`) y las ve todo el mundo.
 * - Las privadas las crea cada usuario (`userId` propio, `scope: "own"`) y solo las ve él.
 * El servidor deriva la propiedad del usuario del token.
 */

/** Categoría a la que pertenece una sección (para agrupar en Home). */
export type SectionCategory =
  | "superior"
  | "inferior"
  | "core"
  | "cardio"
  | "otros";

export interface BodySection {
  id: string;
  name: string;
  /** Grupo muscular / categoría de la sección. */
  category: SectionCategory;
  /** true para las secciones sembradas por defecto; false para las creadas. */
  isDefault: boolean;
  /** null en secciones globales; el id del dueño en secciones propias. */
  userId?: string | null;
  /** "global" = creada por el admin (visible a todos); "own" = privada del usuario. */
  scope: "global" | "own";
}
