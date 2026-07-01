interface ChartPoint {
  /** Etiqueta del eje X (típicamente una fecha YYYY-MM-DD). */
  x: string;
  /** Valor numérico del eje Y. */
  y: number;
}

interface LineChartProps {
  data: ChartPoint[];
  /** Unidad para las etiquetas del eje Y (ej. "kg"). */
  unit?: string;
  /** Mensaje del estado vacío. */
  emptyLabel?: string;
}

// Geometría del viewBox. El SVG escala al ancho del contenedor.
const VB_W = 320;
const VB_H = 180;
const PAD_L = 38;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 26;

const PLOT_W = VB_W - PAD_L - PAD_R;
const PLOT_H = VB_H - PAD_T - PAD_B;

function formatDay(iso: string): string {
  // Espera YYYY-MM-DD (o ISO); muestra DD/MM.
  const d = iso.slice(0, 10).split("-");
  if (d.length === 3) return `${d[2]}/${d[1]}`;
  return iso;
}

function niceValue(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/**
 * Gráfica de línea en SVG puro (sin librerías). Ejes básicos, puntos y línea,
 * responsive al ancho del contenedor. Maneja estado vacío y un solo punto.
 */
export default function LineChart({
  data,
  unit = "",
  emptyLabel = "Aún no hay datos para graficar.",
}: LineChartProps) {
  if (data.length === 0) {
    return <div className="chart-empty">{emptyLabel}</div>;
  }

  const ys = data.map((p) => p.y);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);

  // Evita división por cero cuando todos los valores son iguales.
  if (minY === maxY) {
    const pad = minY === 0 ? 1 : Math.abs(minY) * 0.1;
    minY -= pad;
    maxY += pad;
  }
  const rangeY = maxY - minY;

  const n = data.length;
  const xFor = (i: number): number =>
    n === 1 ? PAD_L + PLOT_W / 2 : PAD_L + (i / (n - 1)) * PLOT_W;
  const yFor = (v: number): number =>
    PAD_T + PLOT_H - ((v - minY) / rangeY) * PLOT_H;

  const coords = data.map((p, i) => ({ cx: xFor(i), cy: yFor(p.y), p }));
  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.cx.toFixed(1)},${c.cy.toFixed(1)}`)
    .join(" ");

  // Área bajo la línea (relleno morado suave), cerrada contra el eje inferior.
  const baseY = PAD_T + PLOT_H;
  const areaPath =
    n > 1
      ? `${linePath} L${coords[n - 1].cx.toFixed(1)},${baseY.toFixed(
          1
        )} L${coords[0].cx.toFixed(1)},${baseY.toFixed(1)} Z`
      : "";

  // Último punto: se resalta como punto "activo".
  const lastIndex = n - 1;

  // Etiquetas del eje Y (min, mitad, max).
  const midY = (minY + maxY) / 2;
  const yTicks = [
    { v: maxY, y: yFor(maxY) },
    { v: midY, y: yFor(midY) },
    { v: minY, y: yFor(minY) },
  ];

  // Muestra hasta ~5 etiquetas en el eje X para no saturar.
  const maxXLabels = 5;
  const xStep = Math.max(1, Math.ceil(n / maxXLabels));

  return (
    <svg
      className="line-chart"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Gráfica de progreso"
    >
      {/* Rejilla + etiquetas Y */}
      {yTicks.map((t, i) => (
        <g key={`y${i}`}>
          <line
            x1={PAD_L}
            y1={t.y}
            x2={VB_W - PAD_R}
            y2={t.y}
            className="chart-grid"
          />
          <text x={PAD_L - 5} y={t.y + 3} className="chart-axis-label" textAnchor="end">
            {niceValue(t.v)}
          </text>
        </g>
      ))}

      {/* Etiquetas X */}
      {coords.map((c, i) =>
        i % xStep === 0 || i === n - 1 ? (
          <text
            key={`x${i}`}
            x={c.cx}
            y={VB_H - 8}
            className="chart-axis-label"
            textAnchor="middle"
          >
            {formatDay(c.p.x)}
          </text>
        ) : null
      )}

      {/* Área bajo la línea */}
      {n > 1 && <path d={areaPath} className="chart-area" />}

      {/* Línea */}
      {n > 1 && <path d={linePath} className="chart-line" fill="none" />}

      {/* Puntos */}
      {coords.map((c, i) => (
        <circle
          key={`p${i}`}
          cx={c.cx}
          cy={c.cy}
          r={i === lastIndex ? 3.4 : 2.6}
          className={i === lastIndex ? "chart-point--active" : "chart-point"}
        >
          <title>
            {formatDay(c.p.x)}: {niceValue(c.p.y)}
            {unit ? ` ${unit}` : ""}
          </title>
        </circle>
      ))}
    </svg>
  );
}

export type { ChartPoint };
