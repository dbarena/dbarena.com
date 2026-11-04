import { joinAnd, sizeWord } from "@/components/home/home-narrative-text";
import type { BenchmarkSummary } from "@/lib/benchmarks";
import {
  formatBoundType,
  providerName,
  type BoundType,
  type ColumnTier,
} from "@/lib/catalog";
import { diskVariantName, isDiskVariant } from "@/lib/comparison-variants";
import { formatInteger } from "@/lib/format";

/**
 * Two results closer than this, relative to the runner-up, are called level
 * rather than a lead. A few percent is within the run-to-run noise of these
 * benchmarks, so naming a leader there would overclaim.
 */
export const NARRATIVE_TIE_THRESHOLD = 0.03;

export type NarrativeColumn = {
  id: string;
  provider: string;
  tier: ColumnTier;
  variant: string | null;
  benchmark: BenchmarkSummary;
};

type MetricId = "value" | "throughput" | "latency";

type NarrativeMetric = {
  id: MetricId;
  /** Noun phrase used after "leads on". */
  phrase: string;
  higherWins: boolean;
  value: (benchmark: BenchmarkSummary) => number | null;
  /** "57 vs 29 tpm/$" — leader's figure against the next best. */
  figures: (leader: number, other: number, versus: "vs" | "next best") => string;
};

/** `unit` carries its own leading space: " tpm/$", " ms". */
function figures(unit: string) {
  return (leader: number, other: number, versus: "vs" | "next best") => {
    const lead = formatInteger(leader);
    const next = formatInteger(other);
    return versus === "vs"
      ? `${lead} vs ${next}${unit}`
      : `${lead}${unit}, next best ${next}${unit}`;
  };
}

const METRICS: NarrativeMetric[] = [
  {
    id: "value",
    phrase: "price-performance",
    higherWins: true,
    value: (benchmark) => benchmark.terminalThroughputPerDollar,
    figures: figures(" tpm/$"),
  },
  {
    id: "throughput",
    phrase: "throughput",
    higherWins: true,
    value: (benchmark) => benchmark.terminalThroughput,
    figures: figures(" tpm"),
  },
  {
    id: "latency",
    phrase: "p95 latency",
    higherWins: false,
    value: (benchmark) => benchmark.terminalP95LatencyMs,
    figures: figures(" ms"),
  },
];

/** Names that stay unambiguous when a provider appears more than once or the
    columns are different sizes. */
function columnLabels(columns: NarrativeColumn[], mixedSizes: boolean) {
  return columns.map((column) => {
    const name = providerName(column.provider);
    const same = columns.filter((other) => other.provider === column.provider);
    const parts: string[] = [];
    if (mixedSizes || same.some((other) => other.tier !== column.tier)) {
      parts.push(sizeWord(column.tier));
    }
    if (
      isDiskVariant(column.variant) &&
      same.some((other) => other.variant !== column.variant)
    ) {
      parts.push(diskVariantName(column.variant));
    }
    return parts.length > 0 ? `${name} (${parts.join(", ")})` : name;
  });
}

type Contest =
  | { kind: "lead"; metric: NarrativeMetric; winner: number; leaderValue: number; nextValue: number }
  | { kind: "level"; metric: NarrativeMetric };

function contest(metric: NarrativeMetric, columns: NarrativeColumn[]): Contest | null {
  const ranked = columns
    .map((column, index) => ({ index, value: metric.value(column.benchmark) }))
    .filter((entry): entry is { index: number; value: number } => entry.value != null)
    .sort((left, right) => (metric.higherWins ? right.value - left.value : left.value - right.value));
  const best = ranked[0];
  const next = ranked[1];
  if (!best || !next) return null;
  const spread = Math.abs(best.value - next.value) / Math.max(Math.abs(next.value), Number.EPSILON);
  if (spread < NARRATIVE_TIE_THRESHOLD) return { kind: "level", metric };
  return { kind: "lead", metric, winner: best.index, leaderValue: best.value, nextValue: next.value };
}

/**
 * The "summary" shown under the comparison: who leads on what, for the
 * configurations currently on screen. Pure and derived entirely from the
 * results, so it follows every filter the reader changes and never makes a
 * claim the table beside it does not.
 *
 * Returns paragraphs, or `null` when fewer than two configurations have
 * results to compare.
 */
export function buildNarrative(
  columns: NarrativeColumn[],
  boundType: BoundType,
): string[] | null {
  if (columns.length < 2) return null;

  const mixedSizes = columns.some((column) => column.tier !== columns[0]!.tier);
  const labels = columnLabels(columns, mixedSizes);
  const conditions = `${mixedSizes ? "mixed sizes" : `${sizeWord(columns[0]!.tier)} size`} with the ${formatBoundType(boundType).toLowerCase()} scenario`;
  const versus = columns.length === 2 ? "vs" : "next best";

  const contests = METRICS.map((metric) => contest(metric, columns)).filter(
    (entry): entry is Contest => entry != null,
  );
  const leads = contests.filter((entry): entry is Extract<Contest, { kind: "lead" }> => entry.kind === "lead");
  const level = contests.filter((entry) => entry.kind === "level").map((entry) => entry.metric.phrase);

  const paragraphs: string[] = [];

  if (leads.length === 0) {
    paragraphs.push(
      `${joinAnd(labels)} are within ${Math.round(NARRATIVE_TIE_THRESHOLD * 100)}% of each other on price-performance, throughput and p95 latency at ${conditions}.`,
    );
  } else {
    // Leaders in order of how many metrics each leads, then column order.
    const byWinner = new Map<number, typeof leads>();
    for (const entry of leads) byWinner.set(entry.winner, [...(byWinner.get(entry.winner) ?? []), entry]);
    const winners = [...byWinner.keys()].sort(
      (left, right) => byWinner.get(right)!.length - byWinner.get(left)!.length || left - right,
    );

    winners.forEach((winner, position) => {
      const led = byWinner.get(winner)!;
      const detail = led.map((entry) => `${entry.metric.phrase} (${entry.metric.figures(entry.leaderValue, entry.nextValue, versus)})`);
      if (position === 0) {
        const others = labels.filter((_, index) => index !== winner);
        paragraphs.push(`Compared to ${joinAnd(others)}, ${labels[winner]} leads on ${joinAnd(detail)} at ${conditions}.`);
      } else {
        paragraphs.push(`${labels[winner]} leads on ${joinAnd(detail)}.`);
      }
    });

    if (level.length > 0) {
      paragraphs.push(
        `${joinAnd(level.map((phrase) => phrase[0]!.toUpperCase() + phrase.slice(1)))} ${level.length === 1 ? "is" : "are"} within ${Math.round(NARRATIVE_TIE_THRESHOLD * 100)}% across these configurations.`,
      );
    }
  }

  if (mixedSizes) {
    paragraphs.push("These configurations are different sizes, so the comparison is not like for like.");
  }

  return paragraphs;
}
