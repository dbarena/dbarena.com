/** Shared geometry for the SVG points and the size buttons beneath them. */
export const RANK_GRID = { axisGutter: 34, padding: 3, gap: 4 };

/** `inset` reserves room on the right for the end labels, so the last column
    center sits far enough left that its label stays inside the chart. */
function columnLayout(count: number, inset: number) {
  const columns = Math.max(1, count);
  const fixed = RANK_GRID.axisGutter + RANK_GRID.padding * 2 + RANK_GRID.gap * (columns - 1) + inset;
  return { columns, fixed };
}

export function rankColumnX(width: number, count: number, index: number, inset = 0) {
  const { columns, fixed } = columnLayout(count, inset);
  const inner = Math.max(0, width - fixed);
  return RANK_GRID.axisGutter + RANK_GRID.padding + RANK_GRID.gap * index + inner * (index + 0.5) / columns;
}

/** First-paint fallback. SVG percentage attributes do not recompute on resize. */
export function rankColumnCss(count: number, index: number, inset = 0) {
  const { columns, fixed } = columnLayout(count, inset);
  const origin = RANK_GRID.axisGutter + RANK_GRID.padding + RANK_GRID.gap * index;
  return `calc(${origin}px + (100% - ${fixed}px) * ${index + 0.5} / ${columns})`;
}

/** Pixel x after the SVG is measured; CSS calc only before the first width. */
export function rankPlotX(width: number, count: number, index: number, inset = 0) {
  return width > 0 ? rankColumnX(width, count, index, inset) : rankColumnCss(count, index, inset);
}

/**
 * The smallest right inset that keeps an end label inside the plot.
 *
 * The last column center already sits half a column plus `rightEdge` away
 * from the plot's right edge, so only the shortfall has to be reserved:
 * solve `lastColumnX(inset) + need === width - rightEdge` for `inset`.
 * Returns 0 when that natural slack is already enough for the label.
 */
export function rankLabelInset(width: number, count: number, need: number, rightEdge: number) {
  const { columns, fixed } = columnLayout(count, 0);
  const origin = RANK_GRID.axisGutter + RANK_GRID.padding + RANK_GRID.gap * (columns - 1);
  const inner = (width - rightEdge - origin - need) * columns / (columns - 0.5);
  return Math.max(0, width - fixed - inner);
}

/**
 * The same inset, as a CSS expression — so the size picker and the caption
 * under the chart can reserve the label strip on the very first paint, before
 * anything has been measured, instead of laying out full width and snapping
 * ~85px narrower the moment the ResizeObserver reports.
 *
 * `rankLabelInset` is linear in the width, so it rearranges into a constant
 * minus a fraction of it: with `k = columns / (columns - 0.5)`,
 *
 *   inset = (1 - k)·width + k·(rightEdge + origin + need) - fixed
 *
 * Exact, not an approximation — the two functions agree at every width, which
 * is what makes the handover from calc() to the measured pixels invisible.
 * Below `END_LABEL_MIN_WIDTH` the labels are not drawn and the strip is not
 * wanted; globals.css zeroes it there on a container query, since this
 * formula only ever grows as the chart narrows.
 */
export function rankLabelInsetCss(count: number, need: number, rightEdge: number) {
  const { columns, fixed } = columnLayout(count, 0);
  const origin = RANK_GRID.axisGutter + RANK_GRID.padding + RANK_GRID.gap * (columns - 1);
  const k = columns / (columns - 0.5);
  const constant = k * (rightEdge + origin + need) - fixed;
  return `max(0px, calc(${constant.toFixed(3)}px - ${((k - 1) * 100).toFixed(4)}%))`;
}

export function rankPlotRight(width: number, inset: number) {
  return width > 0 ? width - inset : `calc(100% - ${inset}px)`;
}
