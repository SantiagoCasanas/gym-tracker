import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Equipment, Exercise, ProgressPoint, SetLog } from "models/index";
import { EQUIPMENT_LABELS, EQUIPMENT_OPTIONS } from "models/index";
import { exerciseService, setLogService } from "services/index";
import { useSession } from "../context/SessionContext";
import {
  formatWeight,
  fromKg,
  roundWeight,
  toKg,
  unitLabel,
  type WeightUnit,
} from "../utils/units";
import PhotoThumb from "../components/PhotoThumb";
import PhotoInput from "../components/PhotoInput";
import LineChart, { type ChartPoint } from "../components/LineChart";

type Metric = "bestWeight" | "estimated1RM";

function epley1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ExerciseDetail() {
  const { exerciseId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useSession();
  const unit: WeightUnit = user?.unit ?? "kg";

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [logs, setLogs] = useState<SetLog[]>([]);
  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>("bestWeight");

  // Unidad con la que se muestra la gráfica (kg por defecto; toggle a lb).
  const [chartUnit, setChartUnit] = useState<WeightUnit>("kg");

  // Modo edición del ejercicio (nombre + equipamiento).
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEquipment, setEditEquipment] = useState<Equipment>("otros");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  async function refresh() {
    try {
      const [ex, history, prog] = await Promise.all([
        exerciseService.get(exerciseId),
        setLogService.listByExercise(exerciseId),
        setLogService.progressByExercise(exerciseId),
      ]);
      setExercise(ex);
      setLogs(history);
      setProgress(prog);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId]);

  async function addSet(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const w = Number(weight);
    const r = Number(reps);
    if (!Number.isFinite(w) || w <= 0) {
      setError(`Ingresa un peso válido (${unitLabel(unit)}).`);
      return;
    }
    if (!Number.isInteger(r) || r <= 0) {
      setError("Ingresa repeticiones válidas.");
      return;
    }
    try {
      // El input está en la unidad del usuario → convertir a kg antes de enviar.
      await setLogService.add(exerciseId, toKg(w, unit), r);
      setWeight("");
      setReps("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    }
  }

  async function removeSet(id: string) {
    await setLogService.remove(id);
    await refresh();
  }

  async function replacePhoto(blob: Blob | null) {
    if (!blob) return;
    await exerciseService.setPhoto(exerciseId, blob);
    await refresh();
  }

  function startEdit() {
    if (!exercise) return;
    setEditName(exercise.name);
    setEditEquipment(exercise.equipment ?? "otros");
    setEditError(null);
    setEditing(true);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError("Escribe un nombre.");
      return;
    }
    setEditSaving(true);
    try {
      await exerciseService.update(exerciseId, {
        name: trimmed,
        equipment: editEquipment,
      });
      setEditing(false);
      await refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setEditSaving(false);
    }
  }

  // Valores de la gráfica: el backend los da en kg; convertimos a chartUnit.
  const chartData: ChartPoint[] = progress.map((p) => {
    const kg = metric === "bestWeight" ? p.bestWeight : p.estimated1RM;
    return { x: p.date, y: roundWeight(fromKg(kg, chartUnit)) };
  });

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page__header page__header--nav">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ‹
        </button>
        <h1>{exercise?.name ?? "Ejercicio"}</h1>
        {exercise && !editing && (
          <button
            type="button"
            className="btn btn--ghost page__header-action"
            onClick={startEdit}
          >
            Editar
          </button>
        )}
      </header>

      {/* Edición de nombre + equipamiento */}
      {editing ? (
        <form className="card form" onSubmit={saveEdit}>
          <h2>Editar ejercicio</h2>
          <label className="field">
            <span>Nombre</span>
            <input
              className="input"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
          </label>
          <label className="field">
            <span>Equipamiento</span>
            <select
              className="input"
              value={editEquipment}
              onChange={(e) => setEditEquipment(e.target.value as Equipment)}
            >
              {EQUIPMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          {editError && <p className="form__error">{editError}</p>}
          <div className="form__row">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setEditing(false);
                setEditError(null);
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={editSaving}
            >
              {editSaving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      ) : (
        exercise && (
          <div className="exercise-meta">
            <span className="badge">
              {EQUIPMENT_LABELS[exercise.equipment ?? "otros"]}
            </span>
          </div>
        )
      )}

      {/* Foto grande de la máquina */}
      <div className="exercise-photo">
        <PhotoThumb photoUrl={exercise?.photoUrl} size="large" />
        <div className="exercise-photo__change">
          <PhotoInput
            onChange={replacePhoto}
            label={
              exercise?.photoUrl
                ? "Cambiar foto"
                : "Agregar foto de la máquina"
            }
          />
        </div>
      </div>

      {/* Registro de serie */}
      <form className="card form" onSubmit={addSet}>
        <h2>Registrar serie</h2>
        <div className="form__grid-2">
          <label className="field">
            <span>Peso ({unitLabel(unit)})</span>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              placeholder="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Reps</span>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              placeholder="0"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
          </label>
        </div>
        {error && <p className="form__error">{error}</p>}
        <button type="submit" className="btn btn--primary btn--block">
          Guardar serie
        </button>
      </form>

      {/* Gráfica de progreso */}
      <section className="card">
        <div className="card__head">
          <h2>Progreso</h2>
          <div className="toggle">
            <button
              className={`toggle__btn ${metric === "bestWeight" ? "is-active" : ""}`}
              onClick={() => setMetric("bestWeight")}
            >
              Mejor peso
            </button>
            <button
              className={`toggle__btn ${metric === "estimated1RM" ? "is-active" : ""}`}
              onClick={() => setMetric("estimated1RM")}
              title="Peso máximo estimado para 1 repetición."
            >
              Fuerza estimada (1RM)
            </button>
          </div>
        </div>
        <div className="card__head">
          <p className="chart-note">
            {metric === "estimated1RM"
              ? "Fuerza estimada (1RM): peso máximo estimado para 1 repetición."
              : ""}
          </p>
          <div className="toggle">
            <button
              className={`toggle__btn ${chartUnit === "kg" ? "is-active" : ""}`}
              onClick={() => setChartUnit("kg")}
            >
              kg
            </button>
            <button
              className={`toggle__btn ${chartUnit === "lb" ? "is-active" : ""}`}
              onClick={() => setChartUnit("lb")}
            >
              lb
            </button>
          </div>
        </div>
        <LineChart
          data={chartData}
          unit={unitLabel(chartUnit)}
          emptyLabel="Registra al menos una serie para ver tu progreso."
        />
      </section>

      {/* Historial */}
      <section>
        <h2 className="section-title">Historial</h2>
        {logs.length === 0 ? (
          <p className="muted">Sin series registradas aún.</p>
        ) : (
          <ul className="log-list">
            {logs.map((log) => (
              <li key={log.id} className="log-item">
                <div className="log-item__main">
                  <span className="log-item__weight">
                    {formatWeight(log.weight, unit)} × {log.reps}
                  </span>
                  <span className="log-item__meta">
                    {formatDateTime(log.date)} · Fuerza est. (1RM) ≈{" "}
                    {formatWeight(epley1RM(log.weight, log.reps), unit)}
                  </span>
                </div>
                <button
                  className="icon-btn icon-btn--danger"
                  aria-label="Eliminar serie"
                  onClick={() => removeSet(log.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
