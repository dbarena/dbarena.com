import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComparePairLinks } from "@/components/compare-pair-links";
import { CompareView } from "@/components/compare-view";
import { getBenchmarks } from "@/lib/benchmarks";
import {
  COMPARE_PAIRS,
  PAIR_BOUND_TYPE,
  comparePairTitle,
  defaultPairTier,
  getComparePair,
  pairColumns,
} from "@/lib/compare-pairs";
import { readComparisonState } from "@/lib/comparison-url";
import { getProviderNotes } from "@/lib/provider-notes";
import { comparePairPageMeta } from "@/lib/site-meta";

// Only the curated pairs exist; any other slug is a 404 rather than a
// request-time render.
export const dynamicParams = false;

export function generateStaticParams() {
  return COMPARE_PAIRS.map((pair) => ({ pair: pair.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const pair = getComparePair((await params).pair);
  if (!pair) notFound();
  return comparePairPageMeta(pair);
}

export default async function ComparePairPage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const pair = getComparePair((await params).pair);
  if (!pair) notFound();

  const [benchmarks, providerNotes] = await Promise.all([
    getBenchmarks(),
    getProviderNotes(),
  ]);
  const tier = defaultPairTier(pair, benchmarks);
  if (!tier) notFound();

  const { boundType, columns } = readComparisonState(
    { bound: PAIR_BOUND_TYPE, cols: pairColumns(pair, tier) },
    benchmarks,
  );

  return (
    <>
      <CompareView
        benchmarks={benchmarks}
        initialBoundType={boundType}
        initialColumns={columns}
        providerNotes={providerNotes}
        title={comparePairTitle(pair)}
      />
      <ComparePairLinks current={pair} />
    </>
  );
}
