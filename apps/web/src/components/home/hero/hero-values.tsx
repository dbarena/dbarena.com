"use client";

import { formatListPrice, formatOrdinal, formatValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HomeData } from "@/components/home/home-data";
import { rankPaint } from "../home-evidence";
import { selectedView } from "./hero-ui";
import type { ChartHighlight } from "./highlight";
import { overallStandings, standingsAtSize, STANDING_METHOD } from "./rank-standing";
import { SwapBlock } from "../ui/swap-block";
import { SwapText } from "../ui/swap-text";

const VALUE_COMPACT = "text-xl leading-[1.2] font-medium tracking-[-0.035em] tabular-nums";
const VALUE_FULL = "text-2xl leading-[1.2] font-medium tracking-[-0.035em] tabular-nums max-[539px]:text-xl";

export function HeroValues({
  captionId,
  compact = false,
  data,
  highlight,
  selected,
}: {
  captionId: string;
  compact?: boolean;
  data: HomeData;
  highlight: ChartHighlight;
  selected: number;
}) {
  // Slot 1 is whoever leads at the selected size, slot 2 the runner-up, and
  // so on. The slots themselves never move: each card is keyed by its
  // position, not by its product, so a size change rewrites the contents in
  // place — the identity crosses through `SwapBlock`, every reading through
  // `SwapText` — instead of gliding four cards to new coordinates.
  const standings = overallStandings(data.rankTier.lines);
  const lines = standings.map((standing) => standing.line);
  const legend = standingsAtSize(standings, selected);
  const view = selectedView(data, selected);
  return (
    <div className="min-w-0 @container/values">
      <p className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-border pt-4 text-note text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground" id={`${captionId}-legend`}>
        <strong>Value at {view.label}</strong>
      </p>
      <div
        aria-describedby={`${captionId}-legend`}
        aria-label="Value at the selected size; select a product to highlight its line"
        className="mt-2 grid grid-cols-1 gap-0 @min-[48rem]/values:grid-cols-2 @min-[48rem]/values:gap-x-6"
        role="group"
      >
        {legend.map(({ line, place, tied }, slot) => {
          // The colour follows the product, not the slot: it has to keep
          // matching the product's line in the chart above.
          const paint = rankPaint(lines.findIndex((candidate) => candidate.provider === line.provider));
          const point = line.points[selected];
          const hasResult = point?.rank != null && point.perDollar != null;
          const row = view.rows.find((candidate) => candidate.provider === line.provider);
          const overall = `${tied ? "Tied " : ""}${formatOrdinal(place)}`;
          return (
            <div className="min-w-0" key={slot}>
              <button
                aria-label={`${line.name}: ${hasResult ? `${formatOrdinal(point.rank!)} at ${view.label}, ${formatValue(point.perDollar!)} tpm/$, ${row?.monthlyUsd != null ? formatListPrice(row.monthlyUsd) : "no listed price"} per month. ${overall} overall.` : `No result at ${view.label}. ${overall} overall.`} Highlight line`}
                aria-pressed={highlight.pinned === line.provider}
                className="group flex w-full min-w-0 cursor-pointer flex-col items-stretch border-b-2 border-border py-3 text-left outline-none aria-pressed:border-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring @min-[48rem]/values:border-transparent"
                onClick={() => {
                  highlight.setHovered(null);
                  highlight.setPinned(highlight.pinned === line.provider ? null : line.provider);
                }}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") highlight.setHovered(line.provider);
                }}
                onPointerLeave={() => highlight.setHovered(null)}
                type="button"
              >
                <span className="block min-w-0 w-full text-caption text-[color:var(--reading-color)] group-aria-pressed:font-medium group-aria-pressed:text-foreground fine-hover:group-hover:text-foreground [&>.swap]:max-w-full [&>.swap]:whitespace-normal [&_.swap-out]:w-full [&_svg]:shrink-0">
                  {/* The mark and the name cross as one object — a colour
                      tween beside a text fade would read as two events. */}
                  <SwapBlock className="flex min-w-0 items-start gap-2" token={line.provider}>
                    <svg aria-hidden="true" height="8" width="18">
                      <line stroke={paint.color} strokeWidth="2" x1="0" x2="18" y1="4" y2="4" />
                    </svg>
                    <span className="min-w-0 break-words">{line.name}</span>
                  </SwapBlock>
                </span>
                <span className="mt-1.5 pl-[26px] text-note text-muted-foreground group-aria-pressed:text-foreground">
                  <SwapText align="start" value={`${overall} overall`} />
                </span>
                <span className={cn(
                  "mt-3 flex min-w-0 justify-between gap-3 pl-[26px] [&>span:last-child]:text-right",
                )}>
                  <span>
                    <span className="flex items-baseline gap-1.5">
                      {/* Always mounted, so a slot holding an unmeasured
                          product swaps the chip to a dash rather than
                          dropping it and letting the value jump left. */}
                      <small className="text-note text-muted-foreground"><SwapText align="start" value={hasResult ? formatOrdinal(point.rank!) : "—"} /></small>
                      <strong className={compact ? VALUE_COMPACT : VALUE_FULL}><SwapText align="start" value={hasResult ? formatValue(point.perDollar!) : "—"} /></strong>
                    </span>
                    <small className="mt-[5px] block text-note text-muted-foreground"><SwapText align="start" value={hasResult ? "tpm/$" : "No result"} /></small>
                  </span>
                  <span>
                    <strong className={compact ? VALUE_COMPACT : VALUE_FULL}><SwapText value={row?.monthlyUsd != null ? formatListPrice(row.monthlyUsd) : "—"} /></strong>
                    <small className="mt-[5px] block text-note text-muted-foreground">$/mo</small>
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-note leading-[1.6] text-muted-foreground">
        {STANDING_METHOD}
      </p>
    </div>
  );
}
