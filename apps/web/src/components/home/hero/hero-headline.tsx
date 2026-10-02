import type { HomeData, HomeTier } from "@/components/home/home-data";
import { ActionLink } from "@/components/ui/action-link";
import { countWord } from "../home-narrative-text";

/**
 * Left column of the hero: kicker, H1, thesis, primary CTA. Proof stats sit
 * in `HeroProof` directly below this block so the chart can own the right
 * column on its own.
 */
export function HeroHeadline({ data, view }: { data: HomeData; view: HomeTier }) {
  return (
    <div className="relative min-w-0">
      <p className="flex items-center gap-2 font-mono text-[11px]/[1.5] tracking-[0.045em] text-muted-foreground uppercase">
        Hosted Postgres provider benchmarks
      </p>
      <h1 className="mt-4 text-[length:var(--text-hero)] leading-[1.16] font-medium tracking-[-0.04em]">
        Compare hosted <span className="text-primary">Postgres providers.</span>
      </h1>
      <p className="mt-5 max-w-[34rem] text-subhead font-medium text-[color:var(--reading-color)]">
        Compare absolute and price-performance for {countWord(data.stats.providers)} products across {countWord(data.rankTier.tiers.length)} compute sizes.
      </p>
      <ActionLink className="mt-7" href={view.rows[0]?.compareHref ?? "/compare"} variant="default">
        Compare at {view.label}
      </ActionLink>
    </div>
  );
}
