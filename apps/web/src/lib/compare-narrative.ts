import { joinAnd, sizeWord } from "@/components/home/home-narrative-text";
import type { BenchmarkSummary } from "@/lib/benchmarks";
import {
  formatBoundType,
  providerName,
  type BoundType,
  type ColumnTier,
} from "@/lib/catalog";
import { diskVariantName, isDiskVariant } from "@/lib/comparison-variants";
import { formatInteger, formatMoney } from "@/lib/format";

/**
 * Two measured results closer than this, relative to the runner-up, are called
 * level rather than a lead. A few percent is within the run-to-run noise of
 * these benchmarks, so naming a leader there would overclaim.
 */
export const NARRATIVE_TIE_THRESHOLD = 0.03;

/**
 * List price is published, not measured, so it carries no run-to-run noise and
 * gets a much tighter tolerance: only near-identical prices are called level.
 */
export const NARRATIVE_PRICE_TIE_THRESHOLD = 0.01;

export type NarrativeColumn = {
  id: string;
  provider: string;
  tier: ColumnTier;
  variant: string | null;
  benchmark: BenchmarkSummary;
};

type NarrativeMetric = {
  id: "value" | "throughput" | "latency" | "cost";
  /** Noun phrase used after "leads on" (or in a level note). */
  phrase: string;
  higherWins: boolean;
  tieThreshold: number;
  value: (benchmark: BenchmarkSummary) => number | null;
  /** "57 vs 29 tpm/$" — leader's figure against the next best. */
  figures: (leader: number, other: number, versus: "vs" | "next best") => string;
};

/** `unit` carries its own leading space: " tpm/$", " ms". */
function figures(unit: string, format: (value: number) => string = formatInteger) {
  return (leader: number, other: number, versus: "vs" | "next best") => {
    const lead = format(leader);
    const next = format(other);
    return versus === "vs"
      ? `${lead} vs ${next}${unit}`
      : `${lead}${unit}, next best ${next}${unit}`;
  };
}

/** Measured performance: these are the ones a provider "leads on". */
const PERFORMANCE_METRICS: NarrativeMetric[] = [
  {
    id: "value",
    phrase: "price-performance",
    higherWins: true,
    tieThreshold: NARRATIVE_TIE_THRESHOLD,
    value: (benchmark) => benchmark.terminalThroughputPerDollar,
    figures: figures(" tpm/$"),
  },
  {
    id: "throughput",
    phrase: "throughput",
    higherWins: true,
    tieThreshold: NARRATIVE_TIE_THRESHOLD,
    value: (benchmark) => benchmark.terminalThroughput,
    figures: figures(" tpm"),
  },
  {
    id: "latency",
    phrase: "p95 latency",
    higherWins: false,
    tieThreshold: NARRATIVE_TIE_THRESHOLD,
    value: (benchmark) => benchmark.terminalP95LatencyMs,
    figures: figures(" ms"),
  },
];

/** Monthly list price. Lower wins, but it is worded "costs less", not "leads". */
const COST_METRIC: NarrativeMetric = {
  id: "cost",
  phrase: "monthly list price",
  higherWins: false,
  tieThreshold: NARRATIVE_PRICE_TIE_THRESHOLD,
  value: (benchmark) => benchmark.monthlyUsd,
  figures: figures("", formatMoney),
};

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

type Lead = {
  kind: "lead";
  metric: NarrativeMetric;
  winner: number;
  leaderValue: number;
  nextValue: number;
};
type Level = {
  kind: "level";
  metric: NarrativeMetric;
  /** Every column is level, or only the top two are (a third is behind). */
  scope: "all" | "top";
  /** Exactly equal, not just close. */
  equal: boolean;
};
type Contest = Lead | Level;

function gap(better: number, worse: number) {
  return Math.abs(better - worse) / Math.max(Math.abs(worse), Number.EPSILON);
}

function contest(metric: NarrativeMetric, columns: NarrativeColumn[]): Contest | null {
  const ranked = columns
    .map((column, index) => ({ index, value: metric.value(column.benchmark) }))
    .filter((entry): entry is { index: number; value: number } => entry.value != null)
    .sort((left, right) => (metric.higherWins ? right.value - left.value : left.value - right.value));
  const best = ranked[0];
  const next = ranked[1];
  const worst = ranked.at(-1);
  if (!best || !next || !worst) return null;

  if (gap(best.value, next.value) < metric.tieThreshold) {
    const whole = gap(best.value, worst.value);
    return {
      kind: "level",
      metric,
      scope: whole < metric.tieThreshold ? "all" : "top",
      equal: whole === 0,
    };
  }
  return { kind: "lead", metric, winner: best.index, leaderValue: best.value, nextValue: next.value };
}

const percent = (threshold: number) => `${Math.round(threshold * 100)}%`;
const capitalize = (text: string) => text[0]!.toUpperCase() + text.slice(1);

/** One note per (tolerance, scope) group: "Throughput and p95 latency are within 3% …". */
function levelNotes(levels: Level[]) {
  const notes: string[] = [];
  const groups = new Map<string, { threshold: number; scope: Level["scope"]; phrases: string[] }>();
  for (const level of levels) {
    // Identical list prices read better as "priced the same"; identical
    // measurements still fall under the ordinary tolerance note below.
    if (level.metric.id === "cost" && level.equal && level.scope === "all") {
      notes.push("These configurations are priced the same.");
      continue;
    }
    const key = `${level.metric.tieThreshold}:${level.scope}`;
    const group = groups.get(key) ?? { threshold: level.metric.tieThreshold, scope: level.scope, phrases: [] };
    group.phrases.push(level.metric.phrase);
    groups.set(key, group);
  }
  for (const { threshold, scope, phrases } of groups.values()) {
    const subject = joinAnd(phrases.map((phrase, index) => (index === 0 ? capitalize(phrase) : phrase)));
    notes.push(
      `${subject} ${phrases.length === 1 ? "is" : "are"} within ${percent(threshold)} ${scope === "all" ? "across these configurations" : "between the top two"}.`,
    );
  }
  return notes;
}

/**
 * The "summary" shown under the comparison: who leads on what, and what it
 * costs, for the configurations currently on screen. Pure and derived entirely
 * from the results, so it follows every filter the reader changes and never
 * makes a claim the table beside it does not.
 *
 * Price is left out when the sizes differ: a bigger instance costs more by
 * definition, so a price "win" there says nothing about the providers.
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

  const performance = PERFORMANCE_METRICS.map((metric) => contest(metric, columns)).filter(
    (entry): entry is Contest => entry != null,
  );
  const leads = performance.filter((entry): entry is Lead => entry.kind === "lead");
  const levels = performance.filter((entry): entry is Level => entry.kind === "level");

  const costContest = mixedSizes ? null : contest(COST_METRIC, columns);
  const costLead = costContest?.kind === "lead" ? costContest : null;
  const costLevel = costContest?.kind === "level" ? costContest : null;

  const paragraphs: string[] = [];
  const everythingLevel =
    leads.length === 0 && levels.length > 0 && levels.every((entry) => entry.scope === "all");

  if (everythingLevel) {
    paragraphs.push(
      `${joinAnd(labels)} are within ${percent(NARRATIVE_TIE_THRESHOLD)} of each other on ${joinAnd(levels.map((entry) => entry.metric.phrase))} at ${conditions}.`,
    );
  }

  // Leaders in order of how many metrics each leads, then column order.
  const byWinner = new Map<number, Lead[]>();
  for (const entry of leads) byWinner.set(entry.winner, [...(byWinner.get(entry.winner) ?? []), entry]);
  const winners = [...byWinner.keys()].sort(
    (left, right) => byWinner.get(right)!.length - byWinner.get(left)!.length || left - right,
  );

  winners.forEach((winner, position) => {
    const detail = byWinner
      .get(winner)!
      .map((entry) => `${entry.metric.phrase} (${entry.metric.figures(entry.leaderValue, entry.nextValue, versus)})`);
    if (position === 0) {
      const others = labels.filter((_, index) => index !== winner);
      paragraphs.push(`Compared to ${joinAnd(others)}, ${labels[winner]} leads on ${joinAnd(detail)} at ${conditions}.`);
    } else {
      paragraphs.push(`${labels[winner]} leads on ${joinAnd(detail)}.`);
    }
  });

  // Price is its own sentence, independent of who leads on performance.
  if (costLead) {
    const costFigures = COST_METRIC.figures(costLead.leaderValue, costLead.nextValue, versus);
    paragraphs.push(`${labels[costLead.winner]} costs less per month (${costFigures}).`);
  }

  const notes = levelNotes([...(everythingLevel ? [] : levels), ...(costLevel ? [costLevel] : [])]);
  // With no leader to carry the conditions, the first note does.
  if (paragraphs.length === 0 && notes.length > 0) {
    notes[0] = `${notes[0]!.slice(0, -1)} at ${conditions}.`;
  }
  paragraphs.push(...notes);

  if (mixedSizes) {
    paragraphs.push("These configurations are different sizes, so the comparison is not like for like.");
  }

  return paragraphs;
}
