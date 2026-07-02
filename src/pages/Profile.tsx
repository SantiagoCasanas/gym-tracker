import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "services/index";
import { useSession } from "../context/SessionContext";
import { useTheme } from "../theme/ThemeContext";
import type { WeightUnit } from "../utils/units";
import ThemeToggle from "../components/ThemeToggle";
import Avatar from "../components/Avatar";

/** Etiqueta legible del género almacenado. */
function genderLabel(gender: string | null): string | null {
  if (!gender || gender.trim() === "") return null;
  return gender;
}

export default function Profile() {
  const { user, updateUser, logout } = useSession();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Preferencia de unidad de peso (kg/lb).
  const unit: WeightUnit = user?.unit ?? "kg";
  const [unitSaving, setUnitSaving] = useState(false);
  const [unitError, setUnitError] = useState<string | null>(null);

  async function changeUnit(next: WeightUnit) {
    if (next === unit || unitSaving) return;
    setUnitError(null);
    setUnitSaving(true);
    try {
      const updated = await authService.updateProfile({ unit: next });
      updateUser(updated);
    } catch (err) {
      setUnitError(
        err instanceof Error ? err.message : "No se pudo cambiar la unidad."
      );
    } finally {
      setUnitSaving(false);
    }
  }

  // Cambio de la propia contraseña.
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwDone, setPwDone] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwDone(false);
    if (!currentPassword) {
      setPwError("Ingresa tu contraseña actual.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setPwSaving(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPwDone(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      // 401 → la contraseña actual es incorrecta.
      const msg = err instanceof Error ? err.message : "";
      setPwError(
        /sesión expirada/i.test(msg)
          ? "La contraseña actual es incorrecta."
          : msg || "No se pudo cambiar la contraseña."
      );
    } finally {
      setPwSaving(false);
    }
  }

  const gender = genderLabel(user?.gender ?? null);
  const details: string[] = [];
  if (user?.age != null) details.push(`${user.age} años`);
  if (gender) details.push(gender);

  return (
    <div className="page">
      <header className="page__header">
        <h1>Perfil</h1>
      </header>

      <div className="card profile-card">
        <Avatar name={user?.name} avatarUrl={user?.avatarUrl} size="lg" />
        <div>
          <div className="profile-card__name">{user?.name}</div>
          <div className="muted">{user?.email}</div>
          {details.length > 0 && (
            <div className="muted profile-card__details">
              {details.join(" · ")}
            </div>
          )}
          <span className="badge badge--accent profile-card__role">
            {user?.role === "ADMIN" ? "Administrador" : "Miembro"}
          </span>
        </div>
      </div>

      <button
        className="btn btn--primary btn--block"
        onClick={() => navigate("/profile/edit")}
      >
        Editar perfil
      </button>

      <form className="card form" onSubmit={changePassword}>
        <h2>Cambiar mi contraseña</h2>
        <label className="field">
          <span>Contraseña actual</span>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="Tu contraseña actual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Nueva contraseña</span>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </label>
        {pwError && <p className="form__error">{pwError}</p>}
        {pwDone && <p className="form__hint">Contraseña actualizada.</p>}
        <button
          type="submit"
          className="btn btn--outline btn--block"
          disabled={pwSaving}
        >
          {pwSaving ? "Guardando…" : "Actualizar contraseña"}
        </button>
      </form>

      <div className="card setting-row">
        <div>
          <div className="setting-row__label">Apariencia</div>
          <div className="muted setting-row__hint">
            Tema {theme === "dark" ? "oscuro" : "claro"}
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div className="card setting-row">
        <div>
          <div className="setting-row__label">Unidad de peso</div>
          <div className="muted setting-row__hint">
            {unitError ?? "Se aplica en todos los pesos de la app."}
          </div>
        </div>
        <div className="toggle">
          <button
            type="button"
            className={`toggle__btn ${unit === "kg" ? "is-active" : ""}`}
            onClick={() => changeUnit("kg")}
            disabled={unitSaving}
          >
            kg
          </button>
          <button
            type="button"
            className={`toggle__btn ${unit === "lb" ? "is-active" : ""}`}
            onClick={() => changeUnit("lb")}
            disabled={unitSaving}
          >
            lb
          </button>
        </div>
      </div>

      {user?.role === "ADMIN" && (
        <>
          <button
            className="btn btn--outline btn--block"
            onClick={() => navigate("/admin/invitations")}
          >
            Gestionar invitaciones
          </button>
          <button
            className="btn btn--outline btn--block"
            onClick={() => navigate("/admin/users")}
          >
            Gestionar usuarios
          </button>
        </>
      )}

      <button className="btn btn--outline btn--block" onClick={logout}>
        Cerrar sesión
      </button>
      <p className="muted profile-hint">
        Tus datos quedan guardados en tu cuenta. Al volver a iniciar sesión los
        recuperarás.
      </p>
    </div>
  );
}
