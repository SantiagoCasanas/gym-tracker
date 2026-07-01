import { useEffect, useState } from "react";
import type { BodyWeightLog } from "models/index";
import type { BodyWeightPoint } from "services/index";
import { bodyWeightService } from "services/index";
import LineChart, { type ChartPoint } from "../components/LineChart";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BodyWeight() {
  const [logs, setLogs] = useState<BodyWeightLog[]>([]);
  const [series, setSeries] = useState<BodyWeightPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [weight, setWeight] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const [list, s] = await Promise.all([
        bodyWeightService.list(),
        bodyWeightService.series(),
      ]);
      setLogs(list);
      setSeries(s);
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
    const w = Number(weight);
    if (!Number.isFinite(w) || w <= 0) {
      setError("Ingresa un peso válido (kg).");
      return;
    }
    try {
      await bodyWeightService.add(w);
      setWeight("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    }
  }

  async function removeLog(id: string) {
    await bodyWeightService.remove(id);
    await refresh();
  }

  const chartData: ChartPoint[] = series.map((p) => ({
    x: p.date,
    y: p.weight,
  }));

  return (
    <div className="page">
      <header className="page__header">
        <h1>Peso corporal</h1>
      </header>

      <form className="card form" onSubmit={submit}>
        <label className="field">
          <span>Registrar peso de hoy (kg)</span>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            placeholder="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </label>
        {error && <p className="form__error">{error}</p>}
        <button type="submit" className="btn btn--primary btn--block">
          Guardar
        </button>
      </form>

      <section className="card">
        <h2>Evolución</h2>
        <LineChart
          data={chartData}
          unit="kg"
          emptyLabel="Registra tu peso para ver la evolución."
        />
      </section>

      <section>
        <h2 className="section-title">Historial</h2>
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : logs.length === 0 ? (
          <p className="muted">Sin registros aún.</p>
        ) : (
          <ul className="log-list">
            {logs.map((log) => (
              <li key={log.id} className="log-item">
                <div className="log-item__main">
                  <span className="log-item__weight">{log.weight} kg</span>
                  <span className="log-item__meta">{formatDate(log.date)}</span>
                </div>
                <button
                  className="icon-btn icon-btn--danger"
                  aria-label="Eliminar registro"
                  onClick={() => removeLog(log.id)}
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
