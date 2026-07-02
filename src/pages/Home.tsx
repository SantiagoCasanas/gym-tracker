import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  BodySection,
  ExerciseSearchResult,
  SectionCategory,
} from "models/index";
import { EQUIPMENT_LABELS } from "models/index";
import { exerciseService, sectionService } from "services/index";
import { useSession } from "../context/SessionContext";
import PhotoThumb from "../components/PhotoThumb";

// Icono representativo por sección conocida (fallback genérico).
const SECTION_ICONS: Record<string, string> = {
  Piernas: "🦵",
  Espalda: "🔙",
  Pecho: "🫀",
  Hombros: "🤷",
  Brazos: "💪",
  Core: "🧱",
  Glúteos: "🍑",
  Pantorrillas: "🦿",
  Cardio: "🏃",
  Abdomen: "🧱",
};

// Orden y etiquetas legibles de las categorías.
const CATEGORY_ORDER: SectionCategory[] = [
  "superior",
  "inferior",
  "core",
  "cardio",
  "otros",
];

const CATEGORY_LABELS: Record<SectionCategory, string> = {
  superior: "Tren superior",
  inferior: "Tren inferior",
  core: "Core / Abdomen",
  cardio: "Cardio",
  otros: "Otros",
};

const CATEGORY_OPTIONS: { value: SectionCategory; label: string }[] =
  CATEGORY_ORDER.map((value) => ({ value, label: CATEGORY_LABELS[value] }));

export default function Home() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [sections, setSections] = useState<BodySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SectionCategory>("otros");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Buscador de ejercicios (con debounce ~300ms).
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExerciseSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  // Guarda el término de la última búsqueda aplicada para el estado "sin resultados".
  const [searchedTerm, setSearchedTerm] = useState("");
  // Id incremental para descartar respuestas de peticiones obsoletas (out-of-order).
  const searchSeq = useRef(0);

  const isAdmin = user?.role === "ADMIN";

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

  // Búsqueda con debounce: al cambiar `query` esperamos 300ms antes de llamar
  // a la API. Si `query` queda vacío, ocultamos resultados (volver a secciones).
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearchedTerm("");
      setSearching(false);
      return;
    }
    setSearching(true);
    const seq = ++searchSeq.current;
    const timer = window.setTimeout(async () => {
      try {
        const found = await exerciseService.search(trimmed);
        if (seq !== searchSeq.current) return; // respuesta obsoleta
        setResults(found);
        setSearchedTerm(trimmed);
      } catch {
        if (seq !== searchSeq.current) return;
        setResults([]);
        setSearchedTerm(trimmed);
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const isSearching = query.trim().length > 0;

  // Agrupa las secciones por categoría, respetando el orden definido y
  // omitiendo las categorías vacías.
  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      items: sections.filter((s) => (s.category ?? "otros") === cat),
    })).filter((g) => g.items.length > 0);
  }, [sections]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Escribe un nombre.");
      return;
    }
    try {
      await sectionService.create(trimmed, category);
      setName("");
      setCategory("otros");
      setAdding(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear.");
    }
  }

  // Un usuario puede borrar una sección si es admin (globales no-default) o si
  // es su propia sección privada. Las 6 defaults globales quedan protegidas.
  function canDelete(s: BodySection): boolean {
    if (s.isDefault) return false;
    if (s.scope === "own") return true;
    return isAdmin; // globales no-default: solo admin.
  }

  async function removeSection(e: React.MouseEvent, s: BodySection) {
    e.stopPropagation();
    const ok = window.confirm(`¿Eliminar la sección "${s.name}"?`);
    if (!ok) return;
    setError(null);
    setDeletingId(s.id);
    try {
      await sectionService.remove(s.id);
      setSections((cur) => cur.filter((x) => x.id !== s.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setDeletingId(null);
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

      {/* Buscador de ejercicios */}
      <div className="search-bar">
        <span className="search-bar__icon" aria-hidden="true">
          🔍
        </span>
        <input
          className="input search-bar__input"
          type="search"
          placeholder="Buscar ejercicio…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar ejercicio"
        />
      </div>

      {isSearching ? (
        <section className="section-group">
          {searching && results.length === 0 ? (
            <p className="muted">Buscando…</p>
          ) : results.length === 0 && searchedTerm ? (
            <div className="empty-state">
              <span className="empty-state__icon">🔍</span>
              <p>Sin resultados para “{searchedTerm}”.</p>
            </div>
          ) : (
            <ul className="exercise-list">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    className="exercise-item"
                    onClick={() => navigate(`/exercise/${r.id}`)}
                  >
                    <PhotoThumb photoUrl={r.photoUrl} size="thumb" />
                    <span className="exercise-item__body">
                      <span className="exercise-item__name">{r.name}</span>
                      <span className="muted exercise-item__section">
                        {r.sectionName}
                      </span>
                    </span>
                    <span className="badge">
                      {EQUIPMENT_LABELS[r.equipment ?? "otros"]}
                    </span>
                    <span className="exercise-item__chevron">›</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : loading ? (
        <p className="muted">Cargando…</p>
      ) : (
        <>
          {grouped.map((group) => (
            <section key={group.category} className="section-group">
              <h2 className="section-group__title">{group.label}</h2>
              <div className="section-grid">
                {group.items.map((s) => (
                  <div key={s.id} className="section-card-wrap">
                    <button
                      className="section-card"
                      onClick={() => navigate(`/section/${s.id}`)}
                    >
                      <span className="section-card__icon">
                        {SECTION_ICONS[s.name] ?? "🏋️"}
                      </span>
                      <span className="section-card__name">{s.name}</span>
                      {s.scope === "own" && (
                        <span className="badge badge--accent section-card__tag">
                          Mía
                        </span>
                      )}
                    </button>
                    {canDelete(s) && (
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger section-card__del"
                        aria-label={`Eliminar ${s.name}`}
                        onClick={(e) => removeSection(e, s)}
                        disabled={deletingId === s.id}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div className="section-add">
            {adding ? (
              <form className="card form" onSubmit={submit}>
                <label className="field">
                  <span>Nombre</span>
                  <input
                    className="input"
                    type="text"
                    placeholder="Nueva sección"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </label>
                <label className="field">
                  <span>Categoría</span>
                  <select
                    className="input"
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as SectionCategory)
                    }
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="form__hint">
                  {isAdmin
                    ? "Esta sección será visible para todos."
                    : "Solo tú la verás."}
                </p>
                {error && <p className="form__error">{error}</p>}
                <div className="section-card__actions">
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => {
                      setAdding(false);
                      setError(null);
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn--primary">
                    Crear
                  </button>
                </div>
              </form>
            ) : (
              <button
                className="btn btn--outline btn--block"
                onClick={() => setAdding(true)}
              >
                ＋ Agregar sección
              </button>
            )}
          </div>
        </>
      )}
      {!adding && error && <p className="form__error">{error}</p>}
    </div>
  );
}
