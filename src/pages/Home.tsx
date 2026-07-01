import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { BodySection } from "models/index";
import { sectionService } from "services/index";
import { useSession } from "../context/SessionContext";

// Icono representativo por sección conocida (fallback genérico).
const SECTION_ICONS: Record<string, string> = {
  Piernas: "🦵",
  Espalda: "🔙",
  Pecho: "🫀",
  Hombros: "🤷",
  Brazos: "💪",
  Core: "🧱",
};

export default function Home() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [sections, setSections] = useState<BodySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const list = await sectionService.list();
      setSections(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar.");
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
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Escribe un nombre.");
      return;
    }
    try {
      await sectionService.create(trimmed);
      setName("");
      setAdding(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear.");
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Hola, {user?.name} 👋</p>
          <h1>Secciones</h1>
        </div>
      </header>

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : (
        <div className="section-grid">
          {sections.map((s) => (
            <button
              key={s.id}
              className="section-card"
              onClick={() => navigate(`/section/${s.id}`)}
            >
              <span className="section-card__icon">
                {SECTION_ICONS[s.name] ?? "🏋️"}
              </span>
              <span className="section-card__name">{s.name}</span>
            </button>
          ))}

          {adding ? (
            <form className="section-card section-card--form" onSubmit={submit}>
              <input
                className="input input--sm"
                type="text"
                placeholder="Nueva sección"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <div className="section-card__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setAdding(false);
                    setError(null);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary btn--sm">
                  Crear
                </button>
              </div>
            </form>
          ) : (
            <button
              className="section-card section-card--add"
              onClick={() => setAdding(true)}
            >
              <span className="section-card__icon">＋</span>
              <span className="section-card__name">Agregar</span>
            </button>
          )}
        </div>
      )}
      {error && <p className="form__error">{error}</p>}
    </div>
  );
}
