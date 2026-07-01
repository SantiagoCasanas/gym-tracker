import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Invitation, UserRole } from "models/index";
import { invitationService } from "services/index";
import { useSession } from "../context/SessionContext";

const STATUS_LABEL: Record<Invitation["status"], string> = {
  pendiente: "Pendiente",
  aceptada: "Aceptada",
  expirada: "Expirada",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Panel de administración de invitaciones (solo ADMIN). */
export default function Invitations() {
  const { user } = useSession();
  const navigate = useNavigate();

  const [list, setList] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Link de respaldo de la invitación recién creada + estado del botón "copiar".
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [lastEmailSent, setLastEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);

  // id de la fila del historial cuyo enlace se acaba de copiar (feedback puntual).
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);

  // id de la invitación que se está reenviando (bloquea el botón).
  const [resendingId, setResendingId] = useState<string | null>(null);
  // Feedback por fila del reenvío: mensaje + tono (ok / warn / error).
  const [resendFeedback, setResendFeedback] = useState<
    Record<string, { message: string; tone: "ok" | "warn" | "error" }>
  >({});

  async function refresh() {
    try {
      const data = await invitationService.list();
      setList(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const mail = email.trim();
    if (!mail) {
      setError("Ingresa un correo.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await invitationService.create(mail, role);
      setLastInviteUrl(res.inviteUrl);
      setLastEmailSent(res.emailSent);
      setCopied(false);
      setEmail("");
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear la invitación."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!lastInviteUrl) return;
    try {
      await navigator.clipboard.writeText(lastInviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar. Copia el enlace manualmente.");
    }
  }

  async function resendInvite(inv: Invitation) {
    if (resendingId) return; // evita doble click / reenvíos concurrentes
    setResendingId(inv.id);
    setResendFeedback((prev) => {
      const next = { ...prev };
      delete next[inv.id];
      return next;
    });
    try {
      const res = await invitationService.resend(inv.id);
      setResendFeedback((prev) => ({
        ...prev,
        [inv.id]: res.emailSent
          ? { message: "✓ Correo reenviado", tone: "ok" }
          : {
              message: "Enviado (SMTP no configurado; usa el link)",
              tone: "warn",
            },
      }));
      // Refresca la lista para reflejar la nueva vigencia/estado.
      await refresh();
    } catch (err) {
      setResendFeedback((prev) => ({
        ...prev,
        [inv.id]: {
          message:
            err instanceof Error
              ? err.message
              : "No se pudo reenviar la invitación.",
          tone: "error",
        },
      }));
    } finally {
      setResendingId(null);
    }
  }

  async function copyRowLink(inv: Invitation) {
    try {
      await navigator.clipboard.writeText(inv.inviteUrl);
      setCopiedRowId(inv.id);
      window.setTimeout(
        () => setCopiedRowId((cur) => (cur === inv.id ? null : cur)),
        2000
      );
    } catch {
      setError("No se pudo copiar. Copia el enlace manualmente.");
    }
  }

  return (
    <div className="page">
      <header className="page__header page__header--nav">
        <button className="back-btn" onClick={() => navigate("/profile")}>
          ‹
        </button>
        <h1>Invitaciones</h1>
      </header>

      {user?.role !== "ADMIN" ? (
        <p className="muted">No tienes permiso para ver esta sección.</p>
      ) : (
        <>
          <form className="card form" onSubmit={submit}>
            <h2>Invitar usuario</h2>
            <label className="field">
              <span>Correo</span>
              <input
                className="input"
                type="email"
                placeholder="nuevo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Rol</span>
              <select
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="MEMBER">Miembro</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>
            {error && <p className="form__error">{error}</p>}
            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={submitting}
            >
              {submitting ? "Enviando…" : "Enviar invitación"}
            </button>
          </form>

          {lastInviteUrl && (
            <div className="card">
              <h2>Enlace de invitación</h2>
              <p className="muted">
                {lastEmailSent
                  ? "Correo enviado. Este es el enlace de respaldo:"
                  : "El correo no pudo enviarse. Comparte este enlace de respaldo:"}
              </p>
              <div className="invite-link">
                <input
                  className="input"
                  type="text"
                  readOnly
                  value={lastInviteUrl}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={copyLink}
                >
                  {copied ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}

          <section>
            <h2 className="section-title">Historial</h2>
            {loading ? (
              <p className="muted">Cargando…</p>
            ) : list.length === 0 ? (
              <p className="muted">Aún no has enviado invitaciones.</p>
            ) : (
              <ul className="log-list">
                {list.map((inv) => (
                  <li key={inv.id} className="invite-row">
                    <div className="invite-row__top">
                      <div>
                        <div className="invite-row__email">{inv.email}</div>
                        <div className="invite-row__meta">
                          {inv.role === "ADMIN" ? "Administrador" : "Miembro"} ·
                          Expira {formatDate(inv.expiresAt)}
                        </div>
                      </div>
                      <span className={`badge badge--${inv.status}`}>
                        {STATUS_LABEL[inv.status]}
                      </span>
                    </div>
                    <div className="invite-link">
                      <input
                        className="input"
                        type="text"
                        readOnly
                        value={inv.inviteUrl}
                        aria-label={`Enlace de invitación de ${inv.email}`}
                        onFocus={(e) => e.currentTarget.select()}
                      />
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={() => copyRowLink(inv)}
                      >
                        {copiedRowId === inv.id ? "¡Copiado!" : "Copiar"}
                      </button>
                    </div>
                    {inv.status !== "aceptada" && (
                      <div className="invite-row__actions">
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => resendInvite(inv)}
                          disabled={resendingId === inv.id}
                        >
                          {resendingId === inv.id
                            ? "Enviando…"
                            : "Reenviar correo"}
                        </button>
                        {resendFeedback[inv.id] && (
                          <span
                            className={`invite-row__resend-msg invite-row__resend-msg--${resendFeedback[inv.id].tone}`}
                          >
                            {resendFeedback[inv.id].message}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
