import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import Avatar from "./Avatar";
import { useSession } from "../context/SessionContext";

/** Header sticky global de la app autenticada: marca + avatar + toggle de tema. */
export default function AppHeader() {
  const navigate = useNavigate();
  const { user } = useSession();

  return (
    <header className="app-header">
      <button
        type="button"
        className="app-header__brand"
        onClick={() => navigate("/")}
        aria-label="Ir a inicio"
      >
        <span className="app-header__logo">🏋️</span>
        <span className="app-header__title">Gym Tracker</span>
      </button>
      <div className="app-header__actions">
        <ThemeToggle />
        <button
          type="button"
          className="app-header__avatar"
          onClick={() => navigate("/profile")}
          aria-label="Ir a perfil"
        >
          <Avatar name={user?.name} avatarUrl={user?.avatarUrl} size="sm" />
        </button>
      </div>
    </header>
  );
}
