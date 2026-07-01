import { useEffect, useRef, useState } from "react";
import { useSession } from "../context/SessionContext";
import { authService } from "services/index";
import ThemeToggle from "../components/ThemeToggle";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as
  | string
  | undefined;
const GOOGLE_SRC = "https://accounts.google.com/gsi/client";

/** Carga (una sola vez) el script de Google Identity Services. */
function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("No se pudo cargar Google."))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = GOOGLE_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Google."));
    document.head.appendChild(script);
  });
}

/** Pantalla de inicio de sesión (email + contraseña, y Google si está configurado). */
export default function Login() {
  const { login, setSession } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const googleEnabled = Boolean(GOOGLE_CLIENT_ID);

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

  // Inicializa Google Identity Services y renderiza el botón oficial.
  useEffect(() => {
    if (!googleEnabled) return;
    let cancelled = false;

    async function handleCredential(response: { credential?: string }) {
      const idToken = response?.credential;
      if (!idToken) {
        setError("No se pudo validar tu cuenta de Google.");
        return;
      }
      setError(null);
      try {
        const { token, user } = await authService.google(idToken);
        setSession(token, user);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("403") || /invitad/i.test(msg)) {
          setError(
            "No estás invitado. Pide al administrador que te invite."
          );
        } else {
          setError("No se pudo validar tu cuenta de Google.");
        }
      }
    }

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredential,
        });
        if (googleBtnRef.current) {
          google.accounts.id.renderButton(googleBtnRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            shape: "pill",
            text: "signin_with",
            logo_alignment: "center",
            width: 280,
          });
        }
      })
      .catch(() => {
        // Si el script no carga, dejamos el login por contraseña intacto.
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleEnabled]);

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

        {googleEnabled && (
          <>
            <div className="auth-divider">
              <span>o</span>
            </div>
            <div className="google-btn" ref={googleBtnRef} />
          </>
        )}
      </form>

      <p className="muted profile-hint">
        El acceso es solo por invitación. Pídele a un administrador que te invite.
      </p>
    </div>
  );
}
