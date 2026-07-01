import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { invitationService } from "services/index";
import { useSession } from "../context/SessionContext";
import ThemeToggle from "../components/ThemeToggle";

type CheckState =
  | { status: "loading" }
  | { status: "valid"; email: string }
  | { status: "invalid" };

/** Aceptación de una invitación (`/accept?token=...`): fija nombre + contraseña y auto-login. */
export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { setSession } = useSession();
  const navigate = useNavigate();

  const [check, setCheck] = useState<CheckState>({ status: "loading" });
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setCheck({ status: "invalid" });
      return;
    }
    (async () => {
      try {
        const res = await invitationService.check(token);
        if (cancelled) return;
        if (res.valid && res.email) {
          setCheck({ status: "valid", email: res.email });
        } else {
          setCheck({ status: "invalid" });
        }
      } catch {
        if (!cancelled) setCheck({ status: "invalid" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Escribe tu nombre.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setSubmitting(true);
    try {
      const { token: authToken, user } = await invitationService.accept(
        token,
        trimmed,
        password
      );
      setSession(authToken, user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo aceptar la invitación."
      );
      setSubmitting(false);
    }
  }

  if (check.status === "loading") {
    return (
      <div className="app-shell gate">
        <p className="muted">Validando invitación…</p>
      </div>
    );
  }

  if (check.status === "invalid") {
    return (
      <div className="app-shell gate">
        <div className="gate__brand">
          <span className="gate__logo">🏋️</span>
          <h1>Invitación no válida</h1>
          <p className="muted">
            Este enlace de invitación no existe o ya expiró.
          </p>
        </div>
        <Link className="btn btn--outline btn--block" to="/login">
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="app-shell gate">
      <div className="gate__top">
        <ThemeToggle />
      </div>
      <div className="gate__brand">
        <span className="gate__logo">🏋️</span>
        <h1>Bienvenido</h1>
        <p className="muted">
          Completa tu registro para <strong>{check.email}</strong>
        </p>
      </div>

      <form className="card form" onSubmit={submit}>
        <div className="invite-account">
          <span className="invite-account__label">Iniciarás sesión con:</span>
          <strong className="invite-account__email">{check.email}</strong>
        </div>
        <label className="field">
          <span>Nombre</span>
          <input
            className="input"
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="form__error">{error}</p>}
        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={submitting}
        >
          {submitting ? "Creando cuenta…" : "Crear cuenta e ingresar"}
        </button>
      </form>
    </div>
  );
}
