import type { BenchmarkSummary } from "@/lib/benchmarks";
import {
  configurationKey,
  getBenchmark,
  isColumnTier,
  parseBoundType,
  parseProvider,
  parseTier,
  resolveProvider,
  type BoundType,
  type ColumnChoice,
  type ColumnIdentity,
} from "@/lib/catalog";
import { isDiskVariant } from "@/lib/comparison-variants";
import { COMPARE_HREF } from "@/lib/site-links";

export { parseBoundType, parseTier };

export type ComparisonSearch = {
  bound?: string | string[];
  cols?: string | string[];
};

type ColumnSpec = {
  provider: ColumnChoice["provider"];
  tier: ColumnChoice["tier"];
  variant?: string | null;
};

const BOUND_PARAM = "bound";
const COLS_PARAM = "cols";

const DEFAULT_BOUND_TYPE: BoundType = "cache-exceeding";
const DEFAULT_COLUMN_SPECS: ColumnSpec[] = [
  { provider: "rds", tier: "small" },
  { provider: "supabase", tier: "small" },
];

export function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.find((entry) => entry.length > 0);
  }
  return value;
}

function parseColumnSpec(token: string): ColumnSpec | null {
  const parts = token.split(":");
  if (parts.length < 2) return null;

  const last = parts.at(-1);
  const beforeLast = parts.at(-2);
  if (!last || !beforeLast) return null;

  if (parts.length >= 3 && isColumnTier(beforeLast) && !isColumnTier(last)) {
    const provider = parseProvider(parts.slice(0, -2).join(":"));
    const tier = parseTier(beforeLast);
    if (!provider || !tier) return null;
    return { provider, tier, variant: last };
  }

  const provider = parseProvider(parts.slice(0, -1).join(":"));
  const tier = parseTier(last);
  if (!provider || !tier) return null;
  return { provider, tier };
}

function parseColumnSpecs(value: string | undefined) {
  if (value === undefined) return null;

  const specs: ColumnSpec[] = [];
  for (const raw of value.split(",")) {
    const spec = parseColumnSpec(raw.trim().toLowerCase());
    if (spec) specs.push(spec);
  }
  return specs;
}

function serializeColumn(column: ColumnSpec) {
  const base = `${column.provider}:${column.tier}`;
  return isDiskVariant(column.variant) ? `${base}:${column.variant}` : base;
}

function toIdentities(specs: ColumnChoice[]): ColumnIdentity[] {
  return specs.map((spec, index) => ({
    id: `comparison-${index + 1}`,
    provider: spec.provider,
    tier: spec.tier,
    variant: spec.variant,
  }));
}

function usableSpecs(
  specs: ColumnSpec[],
  benchmarks: BenchmarkSummary[],
  boundType: BoundType,
) {
  const seen = new Set<string>();
  const next: ColumnChoice[] = [];

  for (const spec of specs) {
    const provider = resolveProvider(spec.provider, benchmarks);
    if (!provider) continue;
    const benchmark = getBenchmark(
      benchmarks,
      provider,
      spec.tier,
      boundType,
      spec.variant,
    );
    if (!benchmark) continue;
    const choice: ColumnChoice = {
      provider,
      tier: spec.tier,
      variant: benchmark.variant,
    };
    const key = configurationKey(choice);
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(choice);
  }

  return next;
}

export function serializeComparisonSearch(
  boundType: BoundType,
  columns: ColumnSpec[],
) {
  const cols = columns.map(serializeColumn).join(",");
  return `${BOUND_PARAM}=${boundType}&${COLS_PARAM}=${cols}`;
}

export function comparisonHref(boundType: BoundType, columns: ColumnSpec[]) {
  return `${COMPARE_HREF}?${serializeComparisonSearch(boundType, columns)}`;
}

export function readComparisonState(
  search: ComparisonSearch,
  benchmarks: BenchmarkSummary[],
) {
  const boundType = parseBoundType(
    firstParam(search.bound)?.trim().toLowerCase(),
    DEFAULT_BOUND_TYPE,
  );
  const requested = parseColumnSpecs(firstParam(search.cols));
  const resolved = usableSpecs(
    requested ?? DEFAULT_COLUMN_SPECS,
    benchmarks,
    boundType,
  );
  const columns = toIdentities(
    resolved.length > 0
      ? resolved
      : usableSpecs(DEFAULT_COLUMN_SPECS, benchmarks, boundType),
  );

  return { boundType, columns };
}

export function writeComparisonSearch(
  boundType: BoundType,
  columns: ColumnSpec[],
) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  params.delete(BOUND_PARAM);
  params.delete(COLS_PARAM);
  const extras = params.toString();
  const query = extras
    ? `${serializeComparisonSearch(boundType, columns)}&${extras}`
    : serializeComparisonSearch(boundType, columns);
  const next = `${window.location.pathname}?${query}${window.location.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current === next) return;

  // Bypass Next's history patch; it would refetch the page on every column change.
  History.prototype.replaceState.call(
    window.history,
    window.history.state,
    "",
    next,
  );
}
