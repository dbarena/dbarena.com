"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ProviderLogo } from "@/components/provider-logo";
import type { DiskVariant } from "@/lib/comparison-variants";
import { formatListPrice, formatValue } from "@/lib/format";
import { cn } from "@/lib/utils";

import { chapterCompareHref, CompareSizeLink } from "./chapter-compare";
import type { HomeChapter, HomeTier } from "./home-data";
import { OptimizationSwitch } from "./optimization-switch";
import { TierSwitch } from "./tier-switch";
import { SwapText } from "./ui/swap-text";

export function SizeControl({
  chapter,
  onSelect,
  onSelectOptimization,
  optimization,
  view,
}: {
  chapter: HomeChapter;
  onSelect: (tier: HomeTier["tier"]) => void;
  onSelectOptimization?: (variant: DiskVariant) => void;
  optimization: DiskVariant;
  view: HomeTier;
}) {
  const compare = (
    <CompareSizeLink className="shrink-0" href={chapterCompareHref(chapter, view.tier, optimization)} label={view.label} />
  );
  if (!chapterHasOptimization(chapter) || !onSelectOptimization) {
    return (
      <div className="flex w-full flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-5">
        <TierSwitch
          className="min-w-0 max-md:gap-x-4"
          views={chapter.tierViews}
          selected={view.tier}
          onSelect={onSelect}
          showInstanceSpec={false}
          tone="rule"
        />
        {compare}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-4 pb-5">
      <TierSwitch
        className="min-w-0 max-md:gap-x-4 @max-[42.5rem]:grow @max-[42.5rem]:basis-full"
        views={chapter.tierViews}
        selected={view.tier}
        onSelect={onSelect}
        showInstanceSpec={false}
        tone="rule"
      />
      <span aria-hidden="true" className="h-[13px] w-px shrink-0 self-end bg-[color-mix(in_srgb,var(--foreground)_22%,transparent)] @max-[42.5rem]:h-px @max-[42.5rem]:w-auto @max-[42.5rem]:flex-auto @max-[42.5rem]:basis-full @max-[42.5rem]:self-auto @max-[42.5rem]:bg-[color-mix(in_srgb,var(--foreground)_28%,transparent)]" />
      <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-x-3 gap-y-3 @max-[42.5rem]:basis-full @max-[42.5rem]:items-start">
        <OptimizationSwitch onSelect={onSelectOptimization} value={optimization} />
        <CompareSizeLink className="shrink-0" href={chapterCompareHref(chapter, view.tier, optimization)} label={view.label} />
      </div>
    </div>
  );
}

function chapterHasOptimization(chapter: HomeChapter) {
  return chapter.tierViews.some((view) => view.hasOptimizationPair);
}

/**
 * Shared row for every chapter's ranked value list (side project, heavy load,
 * cache-exceeding). Rank digit and the `ArrowUpRight` open-affordance are always
 * in the same slot regardless of chapter — only the progress bar (`share`)
 * is chapter-specific, since it's the one dimension meant to vary.
 */
export function ChapterRankRow({
  compareHref,
  enabled,
  leader,
  monthlyUsd,
  name,
  perDollar,
  provider,
  rank,
  share,
  sizeLabel,
}: {
  compareHref: string | null;
  enabled: boolean;
  leader: boolean;
  monthlyUsd: number | null;
  name: string;
  perDollar: number | null;
  provider: string;
  rank: number | null;
  share: number | null;
  sizeLabel: string;
}) {
  if (!compareHref) {
    return (
      <div className="flex min-h-16 items-center gap-2.5 p-3 text-muted-foreground" aria-label={`${name}: no published result at ${sizeLabel}`}>
        <span className="min-w-3 font-mono text-[11px]">—</span>
        <ProviderLogo provider={provider} className="size-5 opacity-50" />
        <span className="min-w-0 flex-1 text-caption [overflow-wrap:anywhere]">{name}</span>
        <span className="text-note">Not measured</span>
      </div>
    );
  }
  return (
    <Link className={cn(
      "flex min-h-16 items-center gap-2.5 rounded-sm p-3 transition-[background-color] duration-fast ease-exit",
      leader ? "bg-[var(--leader-wash)] fine-hover:bg-[var(--leader-wash)]" : "fine-hover:bg-[color-mix(in_srgb,var(--muted)_35%,transparent)]",
    )} href={compareHref}>
      <span className="flex w-full min-w-0 items-center gap-2.5">
        <span className="min-w-3 font-mono text-[11px] text-muted-foreground"><SwapText align="start" value={rank == null ? "—" : String(rank)} /></span>
        <ProviderLogo provider={provider} className="size-5" />
        <span className="min-w-0 flex-1 text-caption [overflow-wrap:anywhere]">{name}</span>
        <span className="flex flex-col items-end gap-0.5">
          <strong className="font-mono text-[13px] tabular-nums"><SwapText value={formatValue(perDollar)} /></strong>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground"><SwapText value={`${formatListPrice(monthlyUsd)}/mo`} /></span>
        </span>
        <ArrowUpRight size={14} aria-hidden="true" className="text-muted-foreground" />
      </span>
      {share != null ? (
        <span className="mt-2.5 block h-[5px] overflow-hidden rounded-sm bg-[color-mix(in_srgb,var(--muted)_70%,transparent)]" aria-hidden="true">
          <Bar enabled={enabled} leader={leader} share={share} />
        </span>
      ) : null}
    </Link>
  );
}

/**
 * Settles to a new length (part of the change beat) whenever the tier or I/O
 * setup changes. Rendered at its correct share on every pass, so it never
 * animates on mount or on scroll — only the CSS transition on `.share-bar`
 * carries it from the old length to the new one, and it eases out rather than
 * overshooting: a measured share has no business bouncing past itself.
 */
export function Bar({ enabled, leader, share }: { enabled: boolean; leader: boolean; share: number }) {
  return (
    <span
      className={cn(
        "block h-full origin-left rounded-[inherit] bg-[color-mix(in_srgb,var(--muted-foreground)_45%,transparent)]",
        leader && "bg-[linear-gradient(90deg,color-mix(in_oklab,var(--primary)_80%,transparent),var(--primary))]",
        enabled && "share-bar",
      )}
      style={{ transform: `scaleX(${share / 100})` }}
    />
  );
}
