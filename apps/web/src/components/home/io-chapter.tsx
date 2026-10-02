"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { ProviderLogo } from "@/components/provider-logo";
import { formatValue } from "@/lib/format";
import { ActionLink } from "@/components/ui/action-link";
import { cn } from "@/lib/utils";
import type { HomeChapter } from "./home-data";
import { VALUE_FOOTNOTE, VALUE_SCALE_NOTE } from "./home-copy";
import { chapterCompareHref, CompareSizeLink } from "./chapter-compare";
import { ChapterHeading, BenchmarkNotes } from "./chapter-heading";
import { ChapterRankRow } from "./chapter-figure";
import { diskLeader, diskStandingAt } from "./io-standing";
import { TierSwitch } from "./tier-switch";
import { useHomeMotion } from "./home-motion";
import { Panel } from "./ui/panel";
import { useFlip } from "./ui/use-flip";
import {
  chapterClass,
  figurePanelClass,
  footnoteClass,
  proseClass,
  providerIdentityClass,
  splitGridClass,
} from "./home-layout";

/**
 * Two figures (03-content-audit.md §7, 05-remake-plan.md §5 "05"): (a) a
 * standing of every product at one selected cache-exceeding size, ranked by
 * tpm/$, with the size switch; (b) the leader's tpm across every size it
 * has a cache-exceeding result for — the plateau. Both read from
 * `chapter.tierViews`, which already carries all seven sizes with every
 * published product per size (`home-data.ts`'s `buildTierView`); no result
 * is silently dropped, a missing product renders "Not measured".
 */
export function IoChapter({ chapter }: { chapter: HomeChapter }) {
  const [tier, setTier] = useState(chapter.tierViews[0]!.tier);
  const view = chapter.tierViews.find((entry) => entry.tier === tier)!;
  const standing = diskStandingAt(chapter.tierViews, tier);
  const plateau = diskLeader(chapter.tierViews);
  const leaderValue = Math.max(1, ...standing.map((entry) => entry.perDollar ?? 0));
  const ceiling = plateau ? Math.max(1, ...plateau.points.map((point) => point.tpm)) : 1;
  const { enabled } = useHomeMotion();
  const list = useRef<HTMLOListElement>(null);
  useFlip(list, tier);

  return <section className={chapterClass} id={chapter.id} aria-labelledby={`${chapter.id}-title`}>
    <div className={splitGridClass}>
      <div>
        <ChapterHeading chapter={chapter} verdict="" />
        <p className={cn(proseClass, "mt-4")}>{chapter.protocol}</p>
        <BenchmarkNotes chapter={chapter} />
        <div className="mt-6"><ActionLink href={chapterCompareHref(chapter, tier)}>Compare cache-exceeding results</ActionLink></div>
      </div>
      <div className="min-w-0">
        <Panel as="div" ticks className={figurePanelClass}>
          <div className="flex w-full flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-5">
            <TierSwitch
              className="min-w-0 max-md:gap-x-4"
              views={chapter.tierViews}
              selected={tier}
              onSelect={setTier}
              showInstanceSpec={false}
              tone="rule"
            />
            <CompareSizeLink className="shrink-0" href={chapterCompareHref(chapter, tier)} label={view.label} />
          </div>
          <p className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-note leading-[1.6] text-muted-foreground">{view.label} · {view.instanceSpec} <span>{VALUE_SCALE_NOTE}</span></p>
          <ol className="mt-2.5 [&>li+li]:border-t [&>li+li]:border-border" aria-label={`Cache-exceed value ranking at ${view.label}`} ref={list}>
            {standing.map((entry) => {
              const share = entry.perDollar != null ? (entry.perDollar / leaderValue) * 100 : 0;
              return <li data-flip={entry.provider} key={entry.provider}>
                <ChapterRankRow
                  compareHref={entry.measured ? (entry.compareHref ?? chapterCompareHref(chapter, tier)) : null}
                  enabled={enabled}
                  leader={entry.rank === 1}
                  monthlyUsd={entry.monthlyUsd}
                  name={entry.name}
                  perDollar={entry.perDollar}
                  provider={entry.provider}
                  rank={entry.rank}
                  share={entry.measured ? share : null}
                  sizeLabel={view.label}
                />
              </li>;
            })}
          </ol>
          <p className={footnoteClass}>{VALUE_FOOTNOTE}</p>

          {plateau != null && plateau.points.length > 0 ? (
            <figure className="mt-5 border-t border-border pt-5">
              <figcaption className={cn(providerIdentityClass, "text-[11px]")}>
                <ProviderLogo provider={plateau.provider} className="size-4" />{plateau.name}
              </figcaption>
              <div className="mt-4 grid gap-2.5 max-md:gap-1.5" style={{ gridTemplateColumns: `repeat(${plateau.points.length}, minmax(0, 1fr))` }}>
                {plateau.points.map((point) => (
                  <Link
                    className="flex flex-col items-center gap-[5px] text-[11px] text-muted-foreground fine-hover:text-foreground fine-hover:[&>span>span]:bg-primary"
                    key={point.tier}
                    href={chapterCompareHref(chapter, point.tier)}
                    aria-label={`${plateau.name} at ${point.label}: ${formatValue(point.tpm)} tpm. Open comparison.`}
                  >
                    <span className="flex h-24 w-full items-end border-b border-border" aria-hidden="true">
                      <IoBar height={(point.tpm / ceiling) * 100} />
                    </span>
                    <strong className="mt-1 font-mono text-[11px] text-foreground max-md:text-[9px] max-md:tracking-tighter">{formatValue(point.tpm)}</strong>
                    <span>{point.label}</span>
                  </Link>
                ))}
              </div>
              <p className={footnoteClass}>Small through 8XLarge · transactions/min</p>
            </figure>
          ) : null}
        </Panel>
      </div>
    </div>
  </section>;
}

/**
 * Static: nothing on this figure changes without a page navigation, so there
 * is no "on change" moment to animate (02-motion-audit.md §5 step 20).
 *
 * All bars share the same grey: the points are the same product at
 * increasing sizes, not several products at one size, so the tallest bar is
 * not a "leader" — the plateau across sizes is the point being shown.
 */
function IoBar({ height }: { height: number }) {
  return (
    <span
      className="mx-auto block w-full max-w-14 origin-bottom rounded-t-sm border-t border-[color-mix(in_srgb,var(--muted-foreground)_70%,transparent)] bg-[color-mix(in_srgb,var(--muted-foreground)_45%,transparent)]"
      style={{ height: `${height}%` }}
    />
  );
}
