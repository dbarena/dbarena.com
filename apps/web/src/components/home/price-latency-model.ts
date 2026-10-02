import type { HomeData, HomeRow, HomeTier } from "./home-data";

export type PriceLatencyRow =
  | { published: true; row: HomeRow }
  | { published: false; provider: string; name: string };

/**
 * The cache-fit tier view for the size at `tierIndex` in `data.crossTier.tiers`
 * — the same lookup the hero's own size picker uses (`hero/hero-ui.tsx`
 * `selectedView`), kept independent here so this section never depends on
 * the hero module.
 */
export function sizeView(data: HomeData, tierIndex: number): HomeTier {
  const tier = data.crossTier.tiers[tierIndex]?.tier;
  return (
    data.chapters.flatMap((chapter) => chapter.tierViews).find((view) => view.tier === tier) ??
    data.hero
  );
}

/**
 * One row per product tracked anywhere on the homepage, for the size at
 * `tierIndex`. A product with no published result at this size still gets a
 * row (`published: false`) instead of disappearing from the table. Sorted by
 * tpm/$ descending; unpriced and unpublished rows sort last.
 */
export function priceLatencyRows(data: HomeData, tierIndex: number): PriceLatencyRow[] {
  const view = sizeView(data, tierIndex);
  const present = new Map(view.rows.map((row) => [row.provider, row]));

  // The universe of tracked products is every provider that appears in any
  // cross-tier line, unioned with whoever is actually published at this
  // size (belt and braces if a provider were ever published somewhere the
  // cross-tier summary missed).
  const universe = new Map<string, string>();
  data.crossTier.lines.forEach((line) => universe.set(line.provider, line.name));
  view.rows.forEach((row) => universe.set(row.provider, row.name));

  const rows: PriceLatencyRow[] = [...universe.entries()].map(([provider, name]) => {
    const row = present.get(provider);
    return row ? { published: true, row } : { published: false, provider, name };
  });

  return rows.sort((left, right) => {
    const a = left.published ? left.row.perDollar : null;
    const b = right.published ? right.row.perDollar : null;
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    return b - a;
  });
}

/** The top-ranked published row at this size — the leader the sparkline and
    "Open compare" link follow. */
export function leaderRow(rows: PriceLatencyRow[]): HomeRow | null {
  const first = rows.find(
    (entry): entry is Extract<PriceLatencyRow, { published: true }> => entry.published,
  );
  return first?.row ?? null;
}

/**
 * Caption for the throughput sparkline: what is plotted, at which size, for
 * which product. It states no sample interval and no run length, because both
 * are set by the protocol rather than by this row, and both have changed.
 */
export function sparklineCaption({ label, row }: { label: string; row: HomeRow | null }): string {
  if (!row) return "No samples published at this size yet.";
  return ["transactions/min", label, row.name].join(" · ");
}
