import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AdminUser } from "models/index";
import { userService } from "services/index";
import { useSession } from "../context/SessionContext";
import Avatar from "../components/Avatar";

/** Panel de administración de usuarios y contraseñas (solo ADMIN). */
export default function Users() {
  const { user } = useSession();
  const navigate = useNavigate();

  const [list, setList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // id del usuario cuya fila de cambio de contraseña está abierta.
  const [openId, setOpenId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  // Estado del borrado de usuario.
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await userService.list();
        if (!cancelled) setList(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function open(id: string) {
    setOpenId(id);
    setPassword("");
    setError(null);
    setDoneId(null);
    setDeleteError(null);
  }

  async function submit(e: React.FormEvent, target: AdminUser) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setSaving(true);
    try {
      await userService.setPassword(target.id, password);
      setDoneId(target.id);
      setOpenId(null);
      setPassword("");
      window.setTimeout(
        () => setDoneId((cur) => (cur === target.id ? null : cur)),
        3000
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cambiar la contraseña."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(target: AdminUser) {
    setDeleteError(null);
    const ok = window.confirm(
      `¿Eliminar a ${target.name}? Se borrará su cuenta y todos sus datos. Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    setDeletingId(target.id);
    try {
      await userService.remove(target.id);
      setList((cur) => cur.filter((u) => u.id !== target.id));
    } catch (err) {
      setDeleteError({
        id: target.id,
        message:
          err instanceof Error
            ? err.message
            : "No se pudo eliminar el usuario.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page">
      <header className="page__header page__header--nav">
        <button className="back-btn" onClick={() => navigate("/profile")}>
          ‹
        </button>
        <h1>Usuarios</h1>
      </header>

      {user?.role !== "ADMIN" ? (
        <p className="muted">No tienes permiso para ver esta sección.</p>
      ) : loading ? (
        <p className="muted">Cargando…</p>
      ) : list.length === 0 ? (
        <p className="muted">Aún no hay usuarios registrados.</p>
      ) : (
        <ul className="log-list">
          {list.map((u) => (
            <li key={u.id} className="card user-card">
              <div className="user-card__top">
                <Avatar name={u.name} size="md" />
                <div className="user-card__info">
                  <div className="user-card__name">{u.name}</div>
                  <div className="user-card__email">{u.email}</div>
                </div>
                <span className="badge badge--accent">
                  {u.role === "ADMIN" ? "Administrador" : "Miembro"}
                </span>
              </div>

              {openId === u.id ? (
                <form className="form" onSubmit={(e) => submit(e, u)}>
                  <label className="field">
                    <span>Nueva contraseña</span>
                    <input
                      className="input"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                    />
                  </label>
                  {error && <p className="form__error">{error}</p>}
                  <div className="section-card__actions">
                    <button
                      type="button"
                      className="btn btn--outline"
                      onClick={() => setOpenId(null)}
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={saving}
                    >
                      {saving ? "Guardando…" : "Guardar"}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {doneId === u.id && (
                    <p className="form__hint">Contraseña actualizada.</p>
                  )}
                  {deleteError?.id === u.id && (
                    <p className="form__error">{deleteError.message}</p>
                  )}
                  <div className="user-card__actions">
                    <button
                      type="button"
                      className="btn btn--outline"
                      onClick={() => open(u.id)}
                    >
                      Cambiar contraseña
                    </button>
                    {u.id !== user?.id && (
                      <button
                        type="button"
                        className="btn btn--danger"
                        onClick={() => remove(u)}
                        disabled={deletingId === u.id}
                      >
                        {deletingId === u.id ? "Eliminando…" : "Eliminar"}
                      </button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
