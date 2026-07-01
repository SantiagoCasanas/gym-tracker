import { toAbsoluteUrl } from "../api/client";

interface PhotoThumbProps {
  /** URL relativa de la foto en el servidor (`/uploads/...`) o null si no tiene. */
  photoUrl?: string | null;
  /** Modo de tamaño: miniatura (lista) o grande (detalle). */
  size?: "thumb" | "large";
  /** Texto alternativo. */
  alt?: string;
}

/**
 * Muestra la foto de un ejercicio servida por la API. Antepone la base URL
 * (`VITE_API_URL`) al `photoUrl` relativo. Renderiza un estado vacío si no hay foto.
 */
export default function PhotoThumb({
  photoUrl,
  size = "thumb",
  alt = "Foto de la máquina",
}: PhotoThumbProps) {
  const src = toAbsoluteUrl(photoUrl);
  const cls = `photo-thumb photo-thumb--${size}`;

  if (!src) {
    return (
      <div className={`${cls} photo-thumb--empty`} aria-hidden>
        <span className="photo-thumb__icon">📷</span>
      </div>
    );
  }

  return (
    <div className={cls}>
      <img src={src} alt={alt} />
    </div>
  );
}
