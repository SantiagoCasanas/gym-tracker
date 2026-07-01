import { NavLink } from "react-router-dom";

const ITEMS = [
  { to: "/", label: "Inicio", icon: "🏠", end: true },
  { to: "/bodyweight", label: "Peso", icon: "⚖️", end: false },
  { to: "/profile", label: "Perfil", icon: "👤", end: false },
] as const;

/** Barra de navegación inferior fija (visible solo con sesión activa). */
export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? "is-active" : ""}`
          }
        >
          <span className="bottom-nav__icon">{item.icon}</span>
          <span className="bottom-nav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
