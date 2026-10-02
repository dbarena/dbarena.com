import type { NewOrderSample } from "@/lib/benchmarks";
import type { ColumnProvider } from "@/lib/catalog";
import { formatClients as formatClientCount, formatInteger } from "@/lib/format";

export type OverlayColumn = {
  id: string;
  name: string;
  provider: ColumnProvider;
  clients: number;
  tpm: number;
  series: NewOrderSample[] | null;
};

const ROLLING_MEDIAN_WINDOW = 11;
/** The x axis rounds up to a whole five minutes, so a run that stops a few
    seconds early still reads 30m rather than 29.8m. The measurement length is
    set by the protocol and has changed before, so nothing here assumes one. */
const AXIS_STEP_SECONDS = 5 * 60;
/** A run counts as short when it stops well before the longest run on the
    chart. Comparing against the others rather than a fixed length keeps the
    label meaningful while runs of two different lengths are published. */
const SHORT_RUN_RATIO = 0.92;

const SERIES_COLORS = [
  "var(--compare-series-1)",
  "var(--compare-series-2)",
  "var(--compare-series-3)",
  "var(--compare-series-4)",
  "var(--compare-series-5)",
  "var(--compare-series-6)",
] as const;

export type SeriesMark = {
  color: string;
  width: number;
};

export function seriesMark(
  columns: OverlayColumn[],
  column: OverlayColumn,
): SeriesMark {
  const index = Math.max(
    0,
    columns.findIndex((entry) => entry.id === column.id),
  );
  return {
    color: SERIES_COLORS[index % SERIES_COLORS.length]!,
    width: 2,
  };
}

export function fillId(columnId: string) {
  return `new-order-${columnId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

export { formatClientCount as formatClients, formatInteger };

export function rollingMedian(series: NewOrderSample[]) {
  const radius = Math.floor(ROLLING_MEDIAN_WINDOW / 2);
  return series.map((sample, index) => {
    const start = Math.max(0, index - radius);
    const end = Math.min(series.length, index + radius + 1);
    const window = series
      .slice(start, end)
      .map((entry) => entry.tpm)
      .sort((left, right) => left - right);
    return {
      tSeconds: sample.tSeconds,
      tpm: window[Math.floor(window.length / 2)]!,
    };
  });
}

export function mergeSeries(columns: OverlayColumn[]) {
  const seconds = new Set<number>();
  const byColumn = new Map<string, Map<number, number>>();

  for (const column of columns) {
    const samples = new Map<number, number>();
    for (const sample of column.series ?? []) {
      seconds.add(sample.tSeconds);
      samples.set(sample.tSeconds, sample.tpm);
    }
    byColumn.set(column.id, samples);
  }

  return [...seconds]
    .sort((left, right) => left - right)
    .map((tSeconds) => {
      const row: Record<string, number | null> = { tSeconds };
      for (const column of columns) {
        row[column.id] = byColumn.get(column.id)?.get(tSeconds) ?? null;
      }
      return row;
    });
}

export function overlaySummary(
  columns: OverlayColumn[],
  mixedClients: boolean,
) {
  return columns
    .map((column) => {
      const clients = mixedClients
        ? ` at ${formatClientCount(column.clients)}`
        : "";
      const samples = column.series == null ? ", no time samples" : "";
      return `${column.name}${clients}: ${formatInteger(column.tpm)} tpm${samples}`;
    })
    .join(". ");
}

export function endSeconds(series: NewOrderSample[] | null) {
  if (!series || series.length === 0) return null;
  return series[series.length - 1]?.tSeconds ?? null;
}

export function isShortRun(
  series: NewOrderSample[] | null,
  longestEndSeconds: number,
) {
  const end = endSeconds(series);
  if (end == null || longestEndSeconds <= 0) return false;
  return end < longestEndSeconds * SHORT_RUN_RATIO;
}

export function chartXMax(endSeconds: number) {
  if (endSeconds <= 0) return 0;
  // A run shorter than one step keeps its own end, so a two-minute series
  // still fills the plot instead of huddling in the first fifth of it.
  if (endSeconds <= AXIS_STEP_SECONDS) return endSeconds;
  return Math.ceil(endSeconds / AXIS_STEP_SECONDS) * AXIS_STEP_SECONDS;
}

export function xTicks(endSeconds: number) {
  if (endSeconds <= 0) return [0];
  return [
    ...new Set(
      [0, 0.25, 0.5, 0.75, 1].map((part) => Math.round(endSeconds * part)),
    ),
  ];
}

export function yTicks(ceiling: number) {
  if (ceiling <= 0) return [0];
  const roughStep = Math.max(1, ceiling / 4);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude)
    .find((candidate) => candidate >= roughStep)!;
  const count = Math.ceil(ceiling / step);
  return Array.from({ length: count + 1 }, (_, index) => index * step);
}

export function formatAxisTpm(value: number) {
  if (value === 0) return "0";
  if (value >= 1000) return `${Number((value / 1000).toFixed(1))}k`;
  return String(Math.round(value));
}

export function formatMinutes(tSeconds: number) {
  if (!Number.isFinite(tSeconds)) return "";
  const minutes = tSeconds / 60;
  if (minutes < 1) return `${Math.round(tSeconds)}s`;
  return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1)}m`;
}

export function valueAtTime(
  series: NewOrderSample[] | null | undefined,
  tSeconds: number,
) {
  if (!series || series.length === 0) return null;
  const first = series[0]!;
  const last = series[series.length - 1]!;
  if (tSeconds < first.tSeconds || tSeconds > last.tSeconds) return null;
  for (let index = 1; index < series.length; index++) {
    const right = series[index]!;
    if (right.tSeconds < tSeconds) continue;
    const left = series[index - 1]!;
    const span = right.tSeconds - left.tSeconds;
    if (span === 0) return right.tpm;
    const mix = (tSeconds - left.tSeconds) / span;
    return left.tpm + mix * (right.tpm - left.tpm);
  }
  return last.tpm;
}

export function seriesPoints(
  rows: Record<string, number | null>[],
  columnId: string,
  xMax: number,
  ceiling: number,
) {
  const points: { x: number; y: number }[] = [];
  for (const row of rows) {
    const t = row.tSeconds;
    const value = row[columnId];
    if (typeof t !== "number" || typeof value !== "number") continue;
    points.push({
      x: xMax <= 0 ? 0 : (t / xMax) * 100,
      y: ceiling <= 0 ? 100 : 100 - (value / ceiling) * 100,
    });
  }
  return points;
}

export function linePath(points: readonly { x: number; y: number }[]) {
  if (points.length === 0) return "";
  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join("");
}

export function areaPath(points: readonly { x: number; y: number }[]) {
  const stroke = linePath(points);
  if (!stroke || points.length === 0) return "";
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `${stroke}L${last.x.toFixed(2)} 100L${first.x.toFixed(2)} 100Z`;
}
