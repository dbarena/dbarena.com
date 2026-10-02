import type { HomeTier } from "./home-data";

/**
 * Pure derivations for the "When disk is the limit" chapter's two figures.
 * Both read `HomeChapter.tierViews` as already built by `home-data.ts` —
 * for the cache-exceeding chapter that array covers all seven sizes, and each
 * `HomeTier.rows` already lists every product with a published result at
 * that size. Nothing here talks to the catalog directly.
 */

export type DiskStandingEntry = {
  provider: string;
  name: string;
  /** Shared rank position on tpm/$ at this size; null when unpriced. */
  rank: number | null;
  perDollar: number | null;
  monthlyUsd: number | null;
  /** Null when the product has no published result at this size — render a
      "Not measured" placeholder rather than shortening the list. */
  compareHref: string | null;
  measured: boolean;
};

export type DiskPlateauPoint = {
  tier: HomeTier["tier"];
  label: string;
  tpm: number;
};

export type DiskPlateau = {
  provider: string;
  name: string;
  points: DiskPlateauPoint[];
};

/** The full product set for this chapter, in first-seen order across sizes —
    a product missing at one size still appears here if it has a result at
    any other size, so the standing never silently shrinks. */
function catalogProducts(tierViews: HomeTier[]) {
  const seen = new Map<string, { provider: string; name: string }>();
  for (const view of tierViews) {
    for (const row of view.rows) {
      if (!seen.has(row.provider)) seen.set(row.provider, { provider: row.provider, name: row.name });
    }
  }
  return [...seen.values()];
}

/**
 * All products at one cache-exceeding size, ranked by tpm/$. Ties share a rank
 * position; unpriced or absent results sort after every priced one.
 */
export function diskStandingAt(tierViews: HomeTier[], tier: HomeTier["tier"]): DiskStandingEntry[] {
  const view = tierViews.find((entry) => entry.tier === tier);
  const products = catalogProducts(tierViews);
  const priced = (view?.rows ?? []).filter((row) => row.perDollar != null && row.perDollar > 0);
  const ranked = [...priced].sort((left, right) => right.perDollar! - left.perDollar!);

  const entries = products.map((product) => {
    const row = view?.rows.find((entry) => entry.provider === product.provider);
    const isPriced = row?.perDollar != null && row.perDollar > 0;
    return {
      provider: product.provider,
      name: product.name,
      rank: isPriced ? ranked.findIndex((entry) => entry.perDollar === row!.perDollar) + 1 : null,
      perDollar: isPriced ? row!.perDollar : null,
      monthlyUsd: row?.monthlyUsd ?? null,
      compareHref: row?.compareHref ?? null,
      measured: row != null,
    };
  });

  return entries.sort((left, right) => {
    if (left.rank != null && right.rank != null) return left.rank - right.rank;
    if (left.rank != null) return -1;
    if (right.rank != null) return 1;
    return 0;
  });
}

/**
 * The product with the most first-place finishes on tpm/$ across the
 * chapter's sizes, and its tpm at every size that has a result — the
 * plateau figure. Ties keep `catalogProducts`' order.
 */
export function diskLeader(tierViews: HomeTier[]): DiskPlateau | null {
  const products = catalogProducts(tierViews);
  if (products.length === 0) return null;

  const firsts = new Map<string, number>();
  for (const view of tierViews) {
    const priced = view.rows.filter((row) => row.perDollar != null && row.perDollar > 0);
    const top = [...priced].sort((left, right) => right.perDollar! - left.perDollar!)[0];
    if (top) firsts.set(top.provider, (firsts.get(top.provider) ?? 0) + 1);
  }

  let leader = products[0]!;
  let best = -1;
  for (const product of products) {
    const count = firsts.get(product.provider) ?? 0;
    if (count > best) {
      best = count;
      leader = product;
    }
  }

  const points = tierViews.flatMap((view) => {
    const row = view.rows.find((entry) => entry.provider === leader.provider);
    return row ? [{ tier: view.tier, label: view.label, tpm: row.tpm }] : [];
  });

  return { provider: leader.provider, name: leader.name, points };
}
