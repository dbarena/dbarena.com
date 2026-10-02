import { ActionLink } from "@/components/ui/action-link";

import { comparisonHref } from "@/lib/comparison-url";
import type { ColumnTier } from "@/lib/catalog";
import type { DiskVariant } from "@/lib/comparison-variants";
import { COMPARE_HREF } from "@/lib/site-links";

import type { HomeChapter } from "./home-data";
import { SwapText } from "./ui/swap-text";

export function chapterCompareHref(
  chapter: HomeChapter,
  tier: ColumnTier,
  optimization: DiskVariant = "cost-optimized",
) {
  const view = chapter.tierViews.find((entry) => entry.tier === tier);
  if (!view || view.rows.length === 0) return COMPARE_HREF;
  return comparisonHref(
    chapter.boundType,
    view.rows.map((row) => ({
      provider: row.provider,
      tier,
      variant: row.pair ? optimization : undefined,
    })),
  );
}

export function CompareSizeLink({
  className,
  href,
  label = "this size",
}: {
  className?: string;
  href: string;
  label?: string;
}) {
  // "Compare" stays put; only the size re-reads, and the slot eases to its
  // width so the arrow after it glides rather than jumps.
  return (
    <ActionLink className={className} href={href}>
      <span className="inline-flex items-center">
        Compare&nbsp;<SwapText align="start" glide value={label} />
      </span>
    </ActionLink>
  );
}
