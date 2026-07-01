import { toAbsoluteUrl } from "../api/client";

interface AvatarProps {
  /** Nombre del usuario (para la inicial de respaldo). */
  name?: string | null;
  /** URL relativa del avatar en el servidor (`/uploads/...`) o null. */
  avatarUrl?: string | null;
  /** Tamaño: `sm` (header), `md` (default) o `lg` (perfil). */
  size?: "sm" | "md" | "lg";
}

/**
 * Avatar del usuario. Muestra la foto (`VITE_API_URL + avatarUrl`) si existe;
 * si no, la inicial del nombre sobre el degradado morado por defecto.
 */
export default function Avatar({ name, avatarUrl, size = "md" }: AvatarProps) {
  const src = toAbsoluteUrl(avatarUrl);
  const initial = (name?.trim().charAt(0) ?? "?").toUpperCase();
  const cls = `avatar avatar--${size}${src ? " avatar--img" : ""}`;

  if (src) {
    return (
      <span className={cls}>
        <img src={src} alt={name ? `Avatar de ${name}` : "Avatar"} />
      </span>
    );
  }

  return (
    <span className={cls} aria-hidden>
      {initial}
    </span>
  );
}
