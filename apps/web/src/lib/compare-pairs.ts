import type { BenchmarkSummary } from "@/lib/benchmarks";
import {
  getBenchmark,
  providerName,
  TIER_OPTIONS,
  type BoundType,
  type ColumnProvider,
  type ColumnTier,
} from "@/lib/catalog";
import { COMPARE_HREF } from "@/lib/site-links";

/**
 * The curated provider pairs that get their own static page under
 * `/compare/<slug>`. One URL per pair: providers are listed in the catalog's
 * preferred order (`PREFERRED_ORDER`), so there is no reversed duplicate.
 * Anything else stays on the interactive `/compare` tool.
 */
export const COMPARE_PAIRS = [
  { slug: "supabase-vs-orioledb", providers: ["supabase", "orioledb"] },
  { slug: "supabase-vs-google-cloud-sql", providers: ["supabase", "cloud-sql-for-postgres"] },
  { slug: "supabase-vs-aws-rds", providers: ["supabase", "rds"] },
  { slug: "orioledb-vs-google-cloud-sql", providers: ["orioledb", "cloud-sql-for-postgres"] },
  { slug: "orioledb-vs-aws-rds", providers: ["orioledb", "rds"] },
  { slug: "aws-rds-vs-google-cloud-sql", providers: ["rds", "cloud-sql-for-postgres"] },
] as const satisfies ReadonlyArray<{ slug: string; providers: readonly [ColumnProvider, ColumnProvider] }>;

export type ComparePair = (typeof COMPARE_PAIRS)[number];

/** The scenario every pair page opens on. */
export const PAIR_BOUND_TYPE: BoundType = "cache-exceeding";

export function getComparePair(slug: string): ComparePair | undefined {
  return COMPARE_PAIRS.find((pair) => pair.slug === slug);
}

export function comparePairHref(pair: Pick<ComparePair, "slug">) {
  return `${COMPARE_HREF}/${pair.slug}`;
}

export function comparePairTitle(pair: ComparePair) {
  return pair.providers.map((provider) => providerName(provider)).join(" vs ");
}

/** Tiers, smallest first, at which both providers have a measured result. */
export function sharedTiers(
  pair: ComparePair,
  benchmarks: BenchmarkSummary[],
  boundType: BoundType = PAIR_BOUND_TYPE,
): ColumnTier[] {
  return TIER_OPTIONS.map((option) => option.id).filter((tier) =>
    pair.providers.every((provider) => getBenchmark(benchmarks, provider, tier, boundType)),
  );
}

/** The size the page opens on: the smallest one both providers were measured at. */
export function defaultPairTier(pair: ComparePair, benchmarks: BenchmarkSummary[]) {
  return sharedTiers(pair, benchmarks)[0];
}

/** `cols` value in the same format `/compare?cols=` reads. */
export function pairColumns(pair: ComparePair, tier: ColumnTier) {
  return pair.providers.map((provider) => `${provider}:${tier}`).join(",");
}
