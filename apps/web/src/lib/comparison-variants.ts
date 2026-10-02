import type { BenchmarkSummary } from "@/lib/benchmarks";

export const DISK_VARIANTS = [
  "cost-optimized",
  "performance-optimized",
] as const;

export type DiskVariant = (typeof DISK_VARIANTS)[number];

const DISK_VARIANT_SET = new Set<string>(DISK_VARIANTS);

export function isDiskVariant(
  value: string | null | undefined,
): value is DiskVariant {
  return value != null && DISK_VARIANT_SET.has(value);
}

export function diskVariantName(variant: DiskVariant) {
  switch (variant) {
    case "cost-optimized":
      return "Cost optimized";
    case "performance-optimized":
      return "Performance optimized";
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

export function diskVariantShortName(variant: DiskVariant) {
  switch (variant) {
    case "cost-optimized":
      return "Cost";
    case "performance-optimized":
      return "Performance";
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

export function diskVariantSummary(variant: DiskVariant) {
  switch (variant) {
    case "cost-optimized":
      return "Lower provisioned IOPS and disk throughput, which is cheaper but can constrain performance.";
    case "performance-optimized":
      return "Higher provisioned IOPS and disk throughput, which is more expensive but offers typically better performance.";
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

export function variantRank(variant: string | null) {
  if (variant === null) return 0;
  if (variant === "cost-optimized") return 1;
  if (variant === "performance-optimized") return 2;
  return 3;
}

export function pickPreferredBenchmark(matches: readonly BenchmarkSummary[]) {
  if (matches.length === 0) return undefined;
  return [...matches].sort(
    (left, right) => variantRank(left.variant) - variantRank(right.variant),
  )[0];
}

export function pickBenchmarkVariant(
  matches: readonly BenchmarkSummary[],
  variant?: string | null,
) {
  if (variant !== undefined) {
    return (
      matches.find((benchmark) => benchmark.variant === variant) ??
      pickPreferredBenchmark(matches)
    );
  }
  return pickPreferredBenchmark(matches);
}

export function slotResults(
  results: Iterable<BenchmarkSummary>,
  provider: string,
  tier: string,
  boundType: string,
) {
  return [...results].filter(
    (benchmark) =>
      benchmark.provider === provider &&
      benchmark.tier === tier &&
      benchmark.boundType === boundType,
  );
}

export function diskVariantResults(
  results: Iterable<BenchmarkSummary>,
  provider: string,
  tier: string,
  boundType: string,
) {
  return slotResults(results, provider, tier, boundType)
    .filter((benchmark) => isDiskVariant(benchmark.variant))
    .sort(
      (left, right) => variantRank(left.variant) - variantRank(right.variant),
    );
}

export function configurationResults(
  results: Iterable<BenchmarkSummary>,
  provider: string,
  tier: string,
  boundType: string,
) {
  const matches = slotResults(results, provider, tier, boundType);
  const disk = diskVariantResults(matches, provider, tier, boundType);
  if (disk.length > 0) return disk;
  const preferred = pickPreferredBenchmark(matches);
  return preferred ? [preferred] : [];
}
