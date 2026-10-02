import { rankOverview } from "./home-evidence";
import type { HomeData } from "./home-data";

/**
 * The crossover tier `rankOverview()` names (where the leader changes), so
 * the chart opens on an interesting cache-exceeding size. Falls
 * back to "Large" when there is no crossover to report.
 */
export function defaultTierIndex(data: HomeData): number {
  const overview = rankOverview(data.rankTier);
  const crossoverLabel = overview.emphasis.replace(/\.$/, "");
  const crossoverIndex = crossoverLabel
    ? data.rankTier.tiers.findIndex((tier) => tier.label === crossoverLabel)
    : -1;
  if (crossoverIndex >= 0) return crossoverIndex;
  return Math.max(
    0,
    data.rankTier.tiers.findIndex((tier) => tier.tier === "large"),
  );
}
