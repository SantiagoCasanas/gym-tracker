import { useState } from "react";
import { useSession } from "../context/SessionContext";
import ThemeToggle from "../components/ThemeToggle";

/** Pantalla de inicio de sesión (email + contraseña). No hay registro abierto. */
export default function Login() {
  const { login } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const mail = email.trim();
    if (!mail || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setSubmitting(true);
    try {
      await login(mail, password);
      // El guard en App redirige a la app al detectar la sesión.
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell gate">
      <div className="gate__top">
        <ThemeToggle />
      </div>
      <div className="gate__brand">
        <span className="gate__logo">🏋️</span>
        <h1>Gym Tracker</h1>
        <p className="muted">Inicia sesión para entrenar</p>
      </div>

      <form className="card form" onSubmit={submit}>
        <label className="field">
          <span>Correo</span>
          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
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
          {submitting ? "Ingresando…" : "Ingresar"}
        </button>
      </form>

      <p className="muted profile-hint">
        El acceso es solo por invitación. Pídele a un administrador que te invite.
      </p>
    </div>
  );
}
