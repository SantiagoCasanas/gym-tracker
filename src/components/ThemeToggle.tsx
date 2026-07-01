import { useTheme } from "../theme/ThemeContext";

/** Botón sol/luna para alternar tema claro/oscuro. */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={isDark ? "Tema claro" : "Tema oscuro"}
    >
      <span className="theme-toggle__track">
        <span className="theme-toggle__thumb">{isDark ? "🌙" : "☀️"}</span>
      </span>
    </button>
  );
}
