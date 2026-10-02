import type { BenchmarkSummary } from "@/lib/benchmarks";
import type { BoundType, ColumnProvider, ColumnTier } from "@/lib/catalog";
import { comparisonHref } from "@/lib/comparison-url";
import {
  diskVariantName,
  diskVariantResults,
  diskVariantShortName,
  type DiskVariant,
} from "@/lib/comparison-variants";
import { columnsFromSlice } from "@/lib/leaderboard";

export type OptimizationFigure = {
  variant: DiskVariant;
  name: string;
  shortName: string;
  perDollar: number | null;
  tpm: number;
  compareHref: string;
};

export type OptimizationPair = {
  primary: OptimizationFigure;
  secondary: OptimizationFigure;
};

export type StandingSource = {
  provider: string;
  perDollar: number | null;
  tpm: number;
  compareHref: string;
  pair?: OptimizationPair;
};

export type StandingView = {
  variant: DiskVariant | null;
  perDollar: number | null;
  tpm: number;
  compareHref: string;
};

export const OPTIMIZATION_OPTIONS = [
  "cost-optimized",
  "performance-optimized",
] as const satisfies readonly DiskVariant[];

export function optimizationExplainerTitle() {
  return "I/O setup";
}

export function optimizationExplainerLead() {
  return "We match disk configurations across providers as close as possible and on the largest tiers we benchmark two different disk configurations.";
}

export function optimizationFact(variant: DiskVariant) {
  switch (variant) {
    case "cost-optimized":
      return "Lower IOPS and disk throughput, at a lower monthly price.";
    case "performance-optimized":
      return "Higher IOPS and disk throughput, at a higher monthly price.";
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

export function standingFor(
  row: StandingSource,
  optimization: DiskVariant,
): StandingView {
  const figure = figureFor(row, optimization);
  if (!figure) {
    return {
      variant: null,
      perDollar: row.perDollar,
      tpm: row.tpm,
      compareHref: row.compareHref,
    };
  }
  return {
    variant: figure.variant,
    perDollar: figure.perDollar,
    tpm: figure.tpm,
    compareHref: figure.compareHref,
  };
}

export function figureFor(row: StandingSource, optimization: DiskVariant) {
  if (!row.pair) return undefined;
  return optimization === "performance-optimized"
    ? row.pair.secondary
    : row.pair.primary;
}

export function valueLeaders(
  rows: readonly StandingSource[],
  optimization: DiskVariant,
) {
  const scored = rows.map((row) => ({
    provider: row.provider,
    perDollar: standingFor(row, optimization).perDollar,
  }));
  const best = scored.reduce(
    (max, row) =>
      row.perDollar != null && row.perDollar > max ? row.perDollar : max,
    0,
  );
  return new Set(
    scored
      .filter((row) => best > 0 && row.perDollar === best)
      .map((row) => row.provider),
  );
}

export function performanceStanding(rows: readonly StandingSource[]) {
  if (!rows.some((row) => row.pair != null)) {
    return new Map<string, { rank: number | null; perDollar: number | null }>();
  }
  const ranked = [...rows].sort(
    (left, right) =>
      (standingFor(right, "performance-optimized").perDollar ?? -1) -
      (standingFor(left, "performance-optimized").perDollar ?? -1),
  );
  return new Map(
    ranked.map((row) => {
      const perDollar = standingFor(row, "performance-optimized").perDollar;
      return [
        row.provider,
        {
          rank:
            perDollar != null && perDollar > 0
              ? ranked.findIndex(
                  (other) =>
                    standingFor(other, "performance-optimized").perDollar ===
                    perDollar,
                ) + 1
              : null,
          perDollar,
        },
      ];
    }),
  );
}

type Slice = Array<{ provider: string; benchmark: BenchmarkSummary }>;

export function optimizationPair(
  results: Iterable<BenchmarkSummary>,
  provider: ColumnProvider,
  tier: ColumnTier,
  boundType: BoundType,
  slice: Slice,
): OptimizationPair | undefined {
  const disk = diskVariantResults(results, provider, tier, boundType);
  const cost = disk.find((benchmark) => benchmark.variant === "cost-optimized");
  const performance = disk.find(
    (benchmark) => benchmark.variant === "performance-optimized",
  );
  if (!cost || !performance) return undefined;
  return {
    primary: toFigure(cost, "cost-optimized", boundType, tier, slice),
    secondary: toFigure(
      performance,
      "performance-optimized",
      boundType,
      tier,
      slice,
    ),
  };
}

function toFigure(
  benchmark: BenchmarkSummary,
  variant: DiskVariant,
  boundType: BoundType,
  tier: ColumnTier,
  slice: Slice,
): OptimizationFigure {
  return {
    variant,
    name: diskVariantName(variant),
    shortName: diskVariantShortName(variant),
    perDollar: benchmark.terminalThroughputPerDollar,
    tpm: benchmark.terminalThroughput,
    compareHref: comparisonHref(
      boundType,
      columnsFromSlice(slice, tier, benchmark.provider).map((column) =>
        column.provider === benchmark.provider ? { ...column, variant } : column,
      ),
    ),
  };
}
