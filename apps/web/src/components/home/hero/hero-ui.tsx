"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { HomeData } from "@/components/home/home-data";
import { formatDateShort } from "@/lib/format";
import { CLEAN_RUNS, STATS_FOOTNOTE } from "../home-copy";
import { useHomeMotion } from "../home-motion";

/** "Aug 21" — no year, for the start of a measured range that shares its end
    date's year. Kept local rather than added to `lib/format.ts`, which this
    work package does not own. */
const monthDay = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", timeZone: "UTC" });

export function HeroProof({ data }: { data: HomeData }) {
  const from = data.stats.measuredFrom;
  const to = data.measuredTo;
  const sameDay = from.slice(0, 10) === to.slice(0, 10);
  const stats = [
    { value: data.stats.results, label: "published results" },
    { value: data.stats.providers, label: "products" },
    { value: data.rankTier.tiers.length, label: "compute sizes" },
    { value: CLEAN_RUNS, label: "runs" },
  ];
  return (
    <div className="mt-10 max-w-[34rem]">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-5 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="font-mono text-[11px]/[1.4] text-muted-foreground">{stat.label}</dt>
            <dd className="mt-1 text-[1.375rem]/[1.15] font-medium tracking-[-0.04em] tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-note leading-[1.6] text-muted-foreground">
        {STATS_FOOTNOTE}
        <span className="px-1.5 opacity-60">·</span>
        Measured{" "}
        {sameDay ? null : (
          <>
            <time className="text-foreground" dateTime={from}>{monthDay.format(new Date(from))}</time>
            {" – "}
          </>
        )}
        <time className="text-foreground" dateTime={to}>{formatDateShort(to)}</time>
        <span className="px-1.5 opacity-60">·</span>
        <Link className="inline-flex items-center gap-[3px] text-foreground fine-hover:text-primary" href="/methodology">
          How we measure <ArrowUpRight size={12} aria-hidden="true" />
        </Link>
      </p>
    </div>
  );
}

export function SizePicker({ tiers, selected, onSelect }: {
  tiers: HomeData["crossTier"]["tiers"];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const { enabled } = useHomeMotion();
  return (
    <div
      className="seg seg-fill grid-cols-[repeat(var(--size-count,7),minmax(0,1fr))]"
      style={{ "--size-count": tiers.length, "--size-index": selected } as CSSProperties}
      role="group"
      aria-label="Compute size"
      data-slide={enabled ? "on" : undefined}
    >
      {/* The columns are equal width, so the pill can slide on a pure CSS
          transform. motion's layoutId would drag in the layout projection
          engine, which costs more than this whole page's own JS. */}
      {enabled ? <span aria-hidden="true" className="seg-pill" /> : null}
      {tiers.map((tier, index) => {
        const label = sizeAbbrev(tier.label);
        const active = selected === index;
        return (
          <button
            className="relative outline-none focus-visible:ring-2 focus-visible:ring-ring"
            key={tier.tier}
            type="button"
            aria-label={`Inspect ${tier.label}`}
            aria-pressed={active}
            onClick={() => onSelect(index)}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              event.stopPropagation();
              const next = event.key === "Home" ? 0 : event.key === "End" ? tiers.length - 1
                : (index + (event.key === "ArrowRight" ? 1 : -1) + tiers.length) % tiers.length;
              onSelect(next);
              event.currentTarget.parentElement?.querySelectorAll("button")[next]?.focus();
            }}
          >
            <span className="relative">
              {label.full === label.compact ? label.full : (
                <>
                  <span className="max-compact:hidden">{label.full}</span>
                  <span className="hidden max-compact:inline">{label.compact}</span>
                </>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function sizeAbbrev(label: string) {
  const names: Record<string, { full: string; compact: string }> = {
    Small: { full: "S", compact: "S" },
    Medium: { full: "M", compact: "M" },
    Large: { full: "L", compact: "L" },
    XLarge: { full: "XL", compact: "XL" },
    "2XLarge": { full: "2XL", compact: "2X" },
    "4XLarge": { full: "4XL", compact: "4X" },
    "8XLarge": { full: "8XL", compact: "8X" },
  };
  return names[label] ?? { full: label, compact: label };
}

export function selectedView(data: HomeData, index: number) {
  const tier = data.rankTier.tiers[index]?.tier;
  return data.io.tierViews.find(view => view.tier === tier) ?? data.io.tierViews[0] ?? data.hero;
}
