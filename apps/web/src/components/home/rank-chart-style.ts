import type { CrossTierLine } from "./home-data";

/** A plotted point, carrying the index of the compute size it came from so a
    gap in the data cannot shift a dot off the pen's clock below. */
export type PlotPoint = { x: number; y: number; index: number };

export function pathSegments(
  line: CrossTierLine,
  xAt: (index: number) => number,
  yAt: (rank: number) => number,
) {
  const segments: PlotPoint[][] = [];
  let current: PlotPoint[] = [];
  line.points.forEach((point, index) => {
    if (point.rank == null) {
      if (current.length > 0) segments.push(current);
      current = [];
      return;
    }
    current.push({ x: xAt(index), y: yAt(point.rank), index });
  });
  if (current.length > 0) segments.push(current);
  return segments;
}

/** One `<path>` `d` string per drawable segment, for the hero's single-path
    rank lines (motion moment 1 draws the whole segment at once). */
export function toPathD(points: Array<{ x: number; y: number }>) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

/**
 * The pen's clock for one product, in fractions of that product's whole
 * drawn length.
 *
 * The stroke tip moves at constant arc-length speed — `pathLength` normalises
 * every path to the same unit and the draw runs `linear` — so a point's
 * moment is its share of the *length*, not its share of the columns. A steep
 * rank change is a longer run than a flat one, and the dot sitting at its end
 * has to wait for the pen accordingly. `spans` gives each segment its slice
 * of the same clock, so a line broken by a missing size still draws as one
 * continuous stroke instead of both halves starting at once.
 */
export function drawSchedule(segments: PlotPoint[][]) {
  const lengths = segments.map(points => {
    const cumulative = [0];
    for (let i = 1; i < points.length; i += 1) {
      cumulative.push(cumulative[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
    }
    return cumulative;
  });
  const total = lengths.reduce((sum, cumulative) => sum + (cumulative.at(-1) ?? 0), 0) || 1;
  const spans: Array<{ from: number; to: number }> = [];
  const at = new Map<number, number>();
  let drawn = 0;
  segments.forEach((points, segment) => {
    const cumulative = lengths[segment];
    const from = drawn / total;
    points.forEach((point, i) => at.set(point.index, (drawn + cumulative[i]) / total));
    drawn += cumulative.at(-1) ?? 0;
    spans.push({ from, to: drawn / total });
  });
  return { spans, at };
}
