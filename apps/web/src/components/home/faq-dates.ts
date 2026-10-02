import { formatDateShort } from "@/lib/format";

import type { HomeData } from "./home-data";

export type FaqDateRange = { earliest: string; latest: string };

/** Every published row's `measuredTo` date, across every cache-fit chapter
    and the disk-bound chapter. This is the full catalog that the FAQ's
    cadence answer describes. */
function measuredDates(data: HomeData): string[] {
  return [...data.chapters, data.io].flatMap((chapter) =>
    chapter.tierViews.flatMap((view) => view.rows.map((row) => row.measuredTo)),
  );
}

/**
 * Min/max `measuredTo` across the catalog. Falls back to `data.measuredTo`
 * when there are no rows at all. A real catalog always has rows; the
 * fallback keeps this total rather than throwing on an edge case.
 */
export function faqDateRange(data: HomeData): FaqDateRange {
  const dates = measuredDates(data);
  if (dates.length === 0) {
    return { earliest: data.measuredTo, latest: data.measuredTo };
  }
  return {
    earliest: dates.reduce((min, date) => (date < min ? date : min)),
    latest: dates.reduce((max, date) => (date > max ? date : max)),
  };
}

/**
 * The FAQ's "how often do results update" answer. The sentence shape is
 * fixed and the dates come from the catalog. Collapses to a single date when
 * every result shares the same `measuredTo`, rather than printing "the
 * newest ... the oldest ..." with the same date twice.
 */
export function cadenceAnswer({ earliest, latest }: FaqDateRange): string {
  if (earliest === latest) {
    return `We do not run these benchmarks on a fixed cadence. The most recent results shown here are from ${formatDateShort(latest)}.`;
  }
  return `We do not run these benchmarks on a fixed cadence. The results shown here have been gathered between ${formatDateShort(earliest)} and ${formatDateShort(latest)}.`;
}
