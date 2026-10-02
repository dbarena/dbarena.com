import type { Metadata } from "next";

import { CompareView } from "@/components/compare-view";
import { getBenchmarks } from "@/lib/benchmarks";
import { readComparisonState } from "@/lib/comparison-url";
import { getProviderNotes } from "@/lib/provider-notes";
import { comparePageMeta } from "@/lib/site-meta";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{
    bound?: string | string[];
    cols?: string | string[];
  }>;
}): Promise<Metadata> {
  const benchmarks = await getBenchmarks();
  const { boundType, columns } = readComparisonState(
    await searchParams,
    benchmarks,
  );
  return comparePageMeta(boundType, columns);
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{
    bound?: string | string[];
    cols?: string | string[];
  }>;
}) {
  const [benchmarks, providerNotes] = await Promise.all([
    getBenchmarks(),
    getProviderNotes(),
  ]);
  const { boundType, columns } = readComparisonState(
    await searchParams,
    benchmarks,
  );

  return (
    <CompareView
      benchmarks={benchmarks}
      initialBoundType={boundType}
      initialColumns={columns}
      providerNotes={providerNotes}
    />
  );
}
