import {
  sortProviders,
  type ColumnProvider,
  type ColumnTier,
} from "@/lib/catalog";
import type { BenchmarkSummary } from "@/lib/benchmarks";

export function columnsFromSlice(
  slice: Array<{ provider: ColumnProvider; benchmark: BenchmarkSummary }>,
  tier: ColumnTier,
  lead?: ColumnProvider,
) {
  const providers = slice.map((row) => row.provider);
  const ordered = lead
    ? [lead, ...providers.filter((provider) => provider !== lead)]
    : sortProviders(providers);
  return ordered.map((provider) => ({ provider, tier }));
}

export function latestMeasuredTo(benchmarks: BenchmarkSummary[]) {
  return benchmarks.reduce((latest, benchmark) => {
    return benchmark.measuredTo > latest ? benchmark.measuredTo : latest;
  }, benchmarks[0]?.measuredTo ?? new Date(0).toISOString());
}

export function earliestMeasuredTo(benchmarks: BenchmarkSummary[]) {
  return benchmarks.reduce((earliest, benchmark) => {
    return benchmark.measuredTo < earliest ? benchmark.measuredTo : earliest;
  }, benchmarks[0]?.measuredTo ?? new Date(0).toISOString());
}
