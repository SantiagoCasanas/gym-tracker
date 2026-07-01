/**
 * Sección corporal.
 * - Las 6 por defecto son GLOBALES (isDefault:true, userId null).
 * - Las personalizadas son POR USUARIO (isDefault:false, con userId).
 * El servidor deriva la propiedad del usuario del token.
 */
export interface BodySection {
  id: string;
  name: string;
  /** true para las secciones sembradas por defecto; false para las del usuario. */
  isDefault: boolean;
  /** null en defaults globales; el id del dueño en secciones custom. */
  userId?: string | null;
}
