import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Exercise, ProgressPoint, SetLog } from "models/index";
import { exerciseService, setLogService } from "services/index";
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

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [logs, setLogs] = useState<SetLog[]>([]);
  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>("bestWeight");

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
      setError("Ingresa un peso válido (kg).");
      return;
    }
    if (!Number.isInteger(r) || r <= 0) {
      setError("Ingresa repeticiones válidas.");
      return;
    }
    try {
      await setLogService.add(exerciseId, w, r);
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

  const chartData: ChartPoint[] = progress.map((p) => ({
    x: p.date,
    y: metric === "bestWeight" ? p.bestWeight : Math.round(p.estimated1RM * 10) / 10,
  }));

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
      </header>

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
            <span>Peso (kg)</span>
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
        {metric === "estimated1RM" && (
          <p className="chart-note">
            Fuerza estimada (1RM): peso máximo estimado para 1 repetición.
          </p>
        )}
        <LineChart
          data={chartData}
          unit="kg"
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
                    {log.weight} kg × {log.reps}
                  </span>
                  <span className="log-item__meta">
                    {formatDateTime(log.date)} · Fuerza est. (1RM) ≈{" "}
                    {epley1RM(log.weight, log.reps).toFixed(1)} kg
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
