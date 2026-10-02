import type { BenchmarkSummary } from "@/lib/benchmarks";
import { pickBenchmarkVariant, slotResults, variantRank } from "@/lib/comparison-variants";

export type ColumnProvider = string;

export const TIER_OPTIONS = [
  { id: "small", label: "Small", compute: "2 vCPU", memory: "2 GiB" },
  { id: "medium", label: "Medium", compute: "2 vCPU", memory: "4 GiB" },
  { id: "large", label: "Large", compute: "2 vCPU", memory: "8 GiB" },
  { id: "xlarge", label: "XLarge", compute: "4 vCPU", memory: "16 GiB" },
  { id: "2xlarge", label: "2XLarge", compute: "8 vCPU", memory: "32 GiB" },
  { id: "4xlarge", label: "4XLarge", compute: "16 vCPU", memory: "64 GiB" },
  { id: "8xlarge", label: "8XLarge", compute: "32 vCPU", memory: "128 GiB" },
] as const;

export type ColumnTier = (typeof TIER_OPTIONS)[number]["id"];
export type TierOption = (typeof TIER_OPTIONS)[number];
export type BoundType = "cache-fit" | "cache-exceeding";

export type ColumnChoice = {
  provider: ColumnProvider;
  tier: ColumnTier;
  variant: string | null;
};

export type ColumnIdentity = ColumnChoice & {
  id: string;
};

const PROVIDER_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const PREFERRED_ORDER = [
  "supabase",
  "orioledb",
  "rds",
  "cloud-sql-for-postgres",
] as const;

const PRODUCT_ALIASES: Record<string, string> = {
  "amazon-rds": "rds",
  "gcp-cloudsql": "cloud-sql-for-postgres",
};

export const PROVIDER_NAMES: Record<string, string> = {
  "cloud-sql-for-postgres": "Google Cloud SQL for PostgreSQL",
  "gcp-cloudsql": "Google Cloud SQL for PostgreSQL",
  orioledb: "Supabase OrioleDB",
  rds: "Amazon RDS",
  supabase: "Supabase Postgres",
};

export const PROVIDER_KINDS: Record<string, string> = {
  orioledb: "Alternative storage engine",
  supabase: "Default storage engine",
};

export const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  "cloud-sql-for-postgres":
    "Managed Postgres on Google Cloud with configurable compute and storage.",
  "gcp-cloudsql":
    "Managed Postgres on Google Cloud with configurable compute and storage.",
  orioledb:
    "Supabase Postgres running the OrioleDB storage engine instead of the default. The compute sizes match default Supabase Postgres.",
  rds: "Managed Postgres on AWS with instance-sized compute and separately configured storage.",
  supabase:
    "Managed Postgres on the default storage engine, with integrated platform services and fixed compute sizes.",
};

const TIERS = new Set<string>(TIER_OPTIONS.map((tier) => tier.id));

export function isProviderSlug(value: string): value is ColumnProvider {
  return PROVIDER_SLUG.test(value);
}

export function isColumnProvider(value: string): value is ColumnProvider {
  return isProviderSlug(value);
}

export function isColumnTier(value: string | null): value is ColumnTier {
  return value != null && TIERS.has(value);
}

export function isBoundType(value: string): value is BoundType {
  return value === "cache-fit" || value === "cache-exceeding";
}

export function parseProvider(value: string): ColumnProvider | null {
  return isProviderSlug(value) ? value : null;
}

export function providerName(provider: ColumnProvider) {
  return PROVIDER_NAMES[provider] ?? humanizeSlug(provider);
}

export function providerKind(provider: ColumnProvider) {
  return PROVIDER_KINDS[provider] ?? null;
}

export function providerDescription(provider: ColumnProvider) {
  return PROVIDER_DESCRIPTIONS[provider] ?? "";
}

export function sortProviders(providers: Iterable<string>) {
  return [...new Set(providers)].sort((left, right) => {
    const leftRank = PREFERRED_ORDER.indexOf(
      left as (typeof PREFERRED_ORDER)[number],
    );
    const rightRank = PREFERRED_ORDER.indexOf(
      right as (typeof PREFERRED_ORDER)[number],
    );
    if (leftRank === -1 && rightRank === -1) return left.localeCompare(right);
    if (leftRank === -1) return 1;
    if (rightRank === -1) return -1;
    return leftRank - rightRank;
  });
}

export function providersFromBenchmarks(benchmarks: BenchmarkSummary[]) {
  return sortProviders(benchmarks.map((benchmark) => benchmark.provider));
}

export function providersFromCatalog(
  catalog: Map<string, BenchmarkSummary>,
) {
  return sortProviders(
    [...catalog.values()].map((benchmark) => benchmark.provider),
  );
}

export function resolveProvider(
  slug: string,
  benchmarks: BenchmarkSummary[],
): ColumnProvider | null {
  if (!isProviderSlug(slug)) return null;
  const aliased = PRODUCT_ALIASES[slug] ?? slug;
  if (benchmarks.some((benchmark) => benchmark.provider === aliased)) {
    return aliased;
  }
  if (benchmarks.some((benchmark) => benchmark.provider === slug)) return slug;
  const hosted = [
    ...new Set(
      benchmarks
        .filter(
          (benchmark) => benchmark.host === slug || benchmark.host === aliased,
        )
        .map((benchmark) => benchmark.provider),
    ),
  ];
  return hosted.length === 1 ? hosted[0]! : null;
}

function humanizeSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function parseBoundType(
  value: string | undefined,
  fallback: BoundType = "cache-fit",
): BoundType {
  return value === "cache-fit" || value === "cache-exceeding" ? value : fallback;
}

export function parseTier(value: string): ColumnTier | null {
  return isColumnTier(value) ? value : null;
}

export function configurationKey(
  column: Pick<ColumnChoice, "provider" | "tier" | "variant">,
) {
  return `${column.provider}:${column.tier}:${column.variant ?? ""}`;
}

export function catalogKey(
  provider: ColumnProvider,
  tier: ColumnTier,
  boundType: BoundType,
  variant: string | null = null,
) {
  return `${provider}:${tier}:${boundType}:${variant ?? ""}`;
}

export function occupiedKeys(
  columns: Array<Pick<ColumnIdentity, "id" | "provider" | "tier" | "variant">>,
  exceptId?: string,
) {
  return new Set(
    columns
      .filter((column) => column.id !== exceptId)
      .map((column) => configurationKey(column)),
  );
}

export function indexCatalog(benchmarks: BenchmarkSummary[]) {
  const map = new Map<string, BenchmarkSummary>();
  for (const benchmark of benchmarks) {
    const key = catalogKey(
      benchmark.provider,
      benchmark.tier,
      benchmark.boundType,
      benchmark.variant,
    );
    const current = map.get(key);
    if (!current || variantRank(benchmark.variant) < variantRank(current.variant)) {
      map.set(key, benchmark);
    }
  }
  return map;
}

export function getBenchmark(
  benchmarks: BenchmarkSummary[],
  provider: ColumnProvider,
  tier: ColumnTier,
  boundType: BoundType,
  variant?: string | null,
) {
  const resolved = resolveProvider(provider, benchmarks) ?? provider;
  return pickBenchmarkVariant(
    slotResults(benchmarks, resolved, tier, boundType),
    variant,
  );
}

export function lookupBenchmark(
  catalog: Map<string, BenchmarkSummary>,
  provider: ColumnProvider,
  tier: ColumnTier,
  boundType: BoundType,
  variant?: string | null,
) {
  const aliased = PRODUCT_ALIASES[provider] ?? provider;
  const matches = slotResults(catalog.values(), aliased, tier, boundType);
  if (matches.length > 0) return pickBenchmarkVariant(matches, variant);
  // A known product with no result must not resolve to a different product
  // from the same host (Supabase is both a historical product ID and a host).
  if ([...catalog.values()].some((benchmark) => benchmark.provider === aliased)) {
    return undefined;
  }
  const hosted = [...catalog.values()].filter(
    (benchmark) =>
      (benchmark.host === provider || benchmark.host === aliased) &&
      benchmark.tier === tier &&
      benchmark.boundType === boundType,
  );
  const products = new Set(hosted.map((benchmark) => benchmark.provider));
  return products.size === 1
    ? pickBenchmarkVariant(hosted, variant)
    : undefined;
}

export function applyMatchedTier<T extends ColumnIdentity>(
  columns: T[],
  tier: ColumnTier,
) {
  const next = columns.map((column) => ({ ...column, tier }));
  const seen = new Set<string>();

  return next.filter((column) => {
    const key = `${column.provider}:${column.variant ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatBoundType(boundType: BoundType) {
  return boundType === "cache-exceeding" ? "Cache Exceeding" : "Cache Fit";
}

export function availableRotationFrom(
  catalog: Map<string, BenchmarkSummary>,
  boundType: BoundType,
): ColumnChoice[] {
  return [...catalog.values()]
    .filter((benchmark) => benchmark.boundType === boundType)
    .map((benchmark) => ({
      provider: benchmark.provider,
      tier: benchmark.tier,
      variant: benchmark.variant,
    }));
}
