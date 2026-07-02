import { useEffect, useState } from "react";
import type { BodyWeightLog } from "models/index";
import type { BodyWeightPoint } from "services/index";
import { bodyWeightService } from "services/index";
import { useSession } from "../context/SessionContext";
import {
  formatWeight,
  fromKg,
  roundWeight,
  toKg,
  unitLabel,
  type WeightUnit,
} from "../utils/units";
import LineChart, { type ChartPoint } from "../components/LineChart";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BodyWeight() {
  const { user } = useSession();
  const unit: WeightUnit = user?.unit ?? "kg";

  const [logs, setLogs] = useState<BodyWeightLog[]>([]);
  const [series, setSeries] = useState<BodyWeightPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [weight, setWeight] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Unidad de la gráfica (kg por defecto; toggle a lb).
  const [chartUnit, setChartUnit] = useState<WeightUnit>("kg");

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
      setError(`Ingresa un peso válido (${unitLabel(unit)}).`);
      return;
    }
    try {
      // El input está en la unidad del usuario → convertir a kg antes de enviar.
      await bodyWeightService.add(toKg(w, unit));
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

  // La serie viene en kg; convertimos a la unidad elegida en la gráfica.
  const chartData: ChartPoint[] = series.map((p) => ({
    x: p.date,
    y: roundWeight(fromKg(p.weight, chartUnit)),
  }));

  return (
    <div className="page">
      <header className="page__header">
        <h1>Peso corporal</h1>
      </header>

      <form className="card form" onSubmit={submit}>
        <label className="field">
          <span>Registrar peso de hoy ({unitLabel(unit)})</span>
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
        <div className="card__head">
          <h2>Evolución</h2>
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
                  <span className="log-item__weight">
                    {formatWeight(log.weight, unit)}
                  </span>
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
