import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { BodySection, Exercise } from "models/index";
import { exerciseService, sectionService } from "services/index";
import PhotoInput from "../components/PhotoInput";
import PhotoThumb from "../components/PhotoThumb";

export default function SectionDetail() {
  const { sectionId = "" } = useParams();
  const navigate = useNavigate();

  const [section, setSection] = useState<BodySection | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    try {
      const [all, list] = await Promise.all([
        sectionService.list(),
        exerciseService.listBySection(sectionId),
      ]);
      setSection(all.find((s) => s.id === sectionId) ?? null);
      setExercises(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Escribe un nombre.");
      return;
    }
    setSaving(true);
    try {
      await exerciseService.create(sectionId, trimmed, photo ?? undefined);
      setName("");
      setPhoto(null);
      setAdding(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <header className="page__header page__header--nav">
        <button className="back-btn" onClick={() => navigate("/")}>
          ‹
        </button>
        <h1>{section?.name ?? "Sección"}</h1>
      </header>

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : (
        <>
          {exercises.length === 0 && !adding && (
            <div className="empty-state">
              <span className="empty-state__icon">🏋️</span>
              <p>Aún no tienes ejercicios en esta sección.</p>
            </div>
          )}

          <ul className="exercise-list">
            {exercises.map((ex) => (
              <li key={ex.id}>
                <button
                  className="exercise-item"
                  onClick={() => navigate(`/exercise/${ex.id}`)}
                >
                  <PhotoThumb photoUrl={ex.photoUrl} size="thumb" />
                  <span className="exercise-item__name">{ex.name}</span>
                  <span className="exercise-item__chevron">›</span>
                </button>
              </li>
            ))}
          </ul>

          {adding ? (
            <form className="card form" onSubmit={submit}>
              <h2>Nuevo ejercicio</h2>
              <label className="field">
                <span>Nombre</span>
                <input
                  className="input"
                  type="text"
                  placeholder="Ej. Prensa de piernas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </label>
              <label className="field">
                <span>Foto de la máquina (opcional)</span>
                <PhotoInput onChange={setPhoto} />
              </label>
              {error && <p className="form__error">{error}</p>}
              <div className="form__row">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setAdding(false);
                    setError(null);
                    setPhoto(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={saving}
                >
                  {saving ? "Guardando…" : "Agregar"}
                </button>
              </div>
            </form>
          ) : (
            <button
              className="btn btn--outline btn--block"
              onClick={() => setAdding(true)}
            >
              + Agregar ejercicio
            </button>
          )}
        </>
      )}
    </div>
  );
}
