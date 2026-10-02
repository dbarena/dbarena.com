import type { BenchmarkSummary, NewOrderSample } from "@/lib/benchmarks";
import {
  getBenchmark,
  providerName,
  providersFromBenchmarks,
  sortProviders,
  TIER_OPTIONS,
  type BoundType,
  type ColumnTier,
} from "@/lib/catalog";
import { comparisonHref } from "@/lib/comparison-url";
import { instanceSpecFor, situationFor } from "@/lib/home-guide";
import { columnsFromSlice, earliestMeasuredTo, latestMeasuredTo } from "@/lib/leaderboard";
import { githubResultHref } from "@/lib/site-links";

import { CHAPTERS, IO_CHAPTER, type ChapterCopy } from "./home-copy";
import {
  optimizationPair,
  performanceStanding,
  type OptimizationPair,
} from "./optimization-pair";
import { bindChapter } from "./home-narrative";

export type HomeRow = {
  provider: string;
  name: string;
  host: string;
  rank: number;
  perDollar: number | null;
  tpm: number;
  p95: number;
  monthlyUsd: number | null;
  hold: number | null;
  instanceType: string;
  clients: number;
  /** Provisioned disk behind this result; null when the provider does not report it. */
  diskGb: number | null;
  iops: number | null;
  throughputMbps: number | null;
  measuredTo: string;
  series: NewOrderSample[] | null;
  sampleCount: number | null;
  compareHref: string;
  rawHref: string;
  /** Share of the leader's tpm/$, for bar length. */
  share: number;
  pair?: OptimizationPair;
};

export type HomeTier = {
  tier: ColumnTier;
  label: string;
  situation: string;
  hint: string;
  instanceSpec: string;
  rows: HomeRow[];
  hasOptimizationPair: boolean;
};

export type HomeChapter = ChapterCopy & {
  index: number;
  range: string;
  verdict: string;
  body: string;
  tierViews: HomeTier[];
};

export type CrossTierPoint = {
  tier: ColumnTier;
  situation: string;
  label: string;
  rank: number | null;
  perDollar: number | null;
  performanceRank: number | null;
  performancePerDollar: number | null;
};

export type CrossTierLine = {
  provider: string;
  name: string;
  points: CrossTierPoint[];
};

export type HomeData = {
  stats: { results: number; providers: number; tiers: number; measuredFrom: string };
  measuredTo: string;
  hero: HomeTier;
  crossTier: {
    tiers: Array<{ tier: ColumnTier; situation: string; label: string }>;
    lines: CrossTierLine[];
  };
  rankTier: HomeData["crossTier"];
  chapters: HomeChapter[];
  io: HomeChapter;
};

function tierLabel(tier: ColumnTier) {
  return TIER_OPTIONS.find((option) => option.id === tier)?.label ?? tier;
}

function toRow(
  benchmark: BenchmarkSummary,
  boundType: BoundType,
  tier: ColumnTier,
  slice: Array<{ provider: string; benchmark: BenchmarkSummary }>,
  pair: OptimizationPair | undefined,
): Omit<HomeRow, "rank" | "share"> {
  return {
    provider: benchmark.provider,
    name: providerName(benchmark.provider),
    host: benchmark.host,
    perDollar: benchmark.terminalThroughputPerDollar,
    tpm: benchmark.terminalThroughput,
    p95: benchmark.terminalP95LatencyMs,
    monthlyUsd: benchmark.monthlyUsd,
    hold: benchmark.minVsMedian,
    instanceType: benchmark.instanceType,
    clients: benchmark.terminalConcurrency,
    diskGb: benchmark.diskGb,
    iops: benchmark.iops,
    throughputMbps: benchmark.throughputMbps,
    measuredTo: benchmark.measuredTo,
    series: benchmark.newOrderSeries,
    sampleCount: benchmark.sampleCount,
    compareHref:
      pair?.primary.compareHref ??
      comparisonHref(
        boundType,
        columnsFromSlice(slice, tier, benchmark.provider),
      ),
    rawHref: githubResultHref(benchmark.path),
    pair,
  };
}

function buildTierView(
  benchmarks: BenchmarkSummary[],
  tier: ColumnTier,
  boundType: BoundType,
): HomeTier {
  const slice = providersFromBenchmarks(benchmarks).flatMap((provider) => {
    const benchmark = getBenchmark(benchmarks, provider, tier, boundType);
    return benchmark ? [{ provider, benchmark }] : [];
  });

  const ranked = [...slice]
    .sort(
      (left, right) =>
        (right.benchmark.terminalThroughputPerDollar ?? -1) -
        (left.benchmark.terminalThroughputPerDollar ?? -1),
    )
    .map((entry) =>
      toRow(
        entry.benchmark,
        boundType,
        tier,
        slice,
        optimizationPair(
          benchmarks,
          entry.benchmark.provider,
          tier,
          boundType,
          slice,
        ),
      ),
    );

  const leader = ranked[0]?.perDollar ?? null;
  const rows: HomeRow[] = ranked.map((row, index) => ({
    ...row,
    rank: row.perDollar != null ? ranked.findIndex(other => other.perDollar === row.perDollar) + 1 : index + 1,
    share:
      leader && row.perDollar != null && leader > 0 ? row.perDollar / leader : 0,
  }));

  const situation = situationFor(tier);
  return {
    tier,
    label: tierLabel(tier),
    situation: situation.title,
    hint: situation.hint,
    instanceSpec: instanceSpecFor(tier),
    rows,
    hasOptimizationPair: rows.some((row) => row.pair != null),
  };
}

function priorLeader(tiers: ColumnTier[], views: HomeTier[]) {
  const first = tiers[0];
  const index = TIER_OPTIONS.findIndex((option) => option.id === first);
  if (index <= 0) return null;
  const previous = TIER_OPTIONS[index - 1];
  return views.find((view) => view.tier === previous?.id)?.rows[0] ?? null;
}

function crossTierFromViews(views: HomeTier[]): HomeData["crossTier"] {
  return {
    tiers: views.map((entry) => ({
      tier: entry.tier,
      situation: entry.situation,
      label: entry.label,
    })),
    lines: sortProviders(
      views.flatMap((entry) => entry.rows.map((row) => row.provider)),
    ).map((provider) => {
      const named = views.flatMap((entry) => entry.rows).find((row) => row.provider === provider);
      return {
        provider,
        name: named?.name ?? provider,
        points: views.map((entry) => {
          const row = entry.rows.find((item) => item.provider === provider);
          const performance = performanceStanding(entry.rows).get(provider);
          return {
            tier: entry.tier,
            situation: entry.situation,
            label: entry.label,
            rank: row?.perDollar != null && row.perDollar > 0 ? row.rank : null,
            perDollar: row?.perDollar ?? null,
            performanceRank: performance?.rank ?? null,
            performancePerDollar: performance?.perDollar ?? null,
          };
        }),
      };
    }),
  };
}

/** Recomputed from the published catalog; no provider-specific homepage copy. */
export function buildHomeData(benchmarks: BenchmarkSummary[]): HomeData {
  const products = providersFromBenchmarks(benchmarks);
  const computeViews = TIER_OPTIONS.map((option) =>
    buildTierView(benchmarks, option.id, "cache-fit"),
  );
  const rankViews = TIER_OPTIONS.map((option) =>
    buildTierView(benchmarks, option.id, "cache-exceeding"),
  );
  const opening = computeViews[0]?.rows[0] ?? null;
  const view = (tier: ColumnTier, boundType: BoundType) =>
    boundType === "cache-fit"
      ? (computeViews.find((entry) => entry.tier === tier) ??
        buildTierView(benchmarks, tier, boundType))
      : buildTierView(benchmarks, tier, boundType);

  return {
    stats: {
      results: benchmarks.length,
      providers: products.length,
      tiers: new Set(benchmarks.map((benchmark) => benchmark.tier)).size,
      measuredFrom: earliestMeasuredTo(benchmarks),
    },
    measuredTo: latestMeasuredTo(benchmarks),
    hero: computeViews[0] ?? buildTierView(benchmarks, "small", "cache-fit"),
    crossTier: crossTierFromViews(computeViews),
    rankTier: crossTierFromViews(rankViews),
    chapters: CHAPTERS.map((copy, index) =>
      bindChapter(copy, index + 1, copy.tiers.map((tier) => view(tier, copy.boundType)), {
        opening,
        prior: priorLeader(copy.tiers, computeViews),
      }),
    ),
    io: bindChapter(
      IO_CHAPTER,
      CHAPTERS.length + 1,
      IO_CHAPTER.tiers.map((tier) => rankViews.find((entry) => entry.tier === tier) ?? view(tier, IO_CHAPTER.boundType)),
      { opening, prior: null },
    ),
  };
}
