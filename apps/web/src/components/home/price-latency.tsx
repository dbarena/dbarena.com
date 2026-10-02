"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { ProviderLogo } from "@/components/provider-logo";
import { ActionLink } from "@/components/ui/action-link";
import type { ColumnProvider } from "@/lib/catalog";
import { COMPARE_HREF } from "@/lib/site-links";
import {
  formatDateShort,
  formatInteger,
  formatLatency,
  formatListPrice,
  formatValue,
} from "@/lib/format";
import { cn } from "@/lib/utils";

import type { HomeData } from "./home-data";
import { chapterTitleClass, editorialSectionClass, figurePanelClass, footnoteClass, kickerClass } from "./home-layout";
import { leaderRow, priceLatencyRows, sizeView, type PriceLatencyRow } from "./price-latency-model";
import { PriceLatencySpark } from "./price-latency-spark";
import { defaultTierIndex } from "./size-query";
import { TierSwitch } from "./tier-switch";
import { Panel } from "./ui/panel";
import { SwapText } from "./ui/swap-text";
import { useFlip } from "./ui/use-flip";

/**
 * Price, latency and raw samples for every product at one selected size
 * (§5 "06" of the remake plan). Replaces the four-tab preview carousel that
 * used to live in this file: this renders the real table, not a mock of
 * `/compare`.
 */
export function PriceLatency({ data }: { data: HomeData }) {
  const [index, setIndex] = useState(() => defaultTierIndex(data));
  const view = sizeView(data, index);
  const rows = useMemo(() => priceLatencyRows(data, index), [data, index]);
  const leader = leaderRow(rows);
  const sizeViews = useMemo(
    () => data.crossTier.tiers.map((_, tierIndex) => sizeView(data, tierIndex)),
    [data],
  );
  const body = useRef<HTMLTableSectionElement>(null);
  useFlip(body, index);

  return (
    <section aria-labelledby="price-latency-title" className={editorialSectionClass} id="price-latency">
      <p className={cn(kickerClass, "text-primary uppercase")}>At a glance</p>
      <h2 className={chapterTitleClass} id="price-latency-title">
        Key metrics <span className="text-muted-foreground">at every size.</span>
      </h2>

      <Panel as="div" className={cn(figurePanelClass, "mt-7")}>
        <TierSwitch
          className="min-w-0 max-md:gap-x-4"
          onSelect={(tier) => {
            const next = data.crossTier.tiers.findIndex((entry) => entry.tier === tier);
            if (next >= 0) setIndex(next);
          }}
          selected={view.tier}
          showInstanceSpec={false}
          tone="rule"
          views={sizeViews}
        />
        <div
          aria-label={`Price and latency at ${view.label}`}
          className="mt-5 overflow-x-auto overflow-y-hidden focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          role="region"
          tabIndex={0}
        >
          <table className="w-full min-w-[760px] border-collapse text-caption">
            <caption className="sr-only">
              Price, throughput, latency and instance type for every product at {view.label}.
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-4 pb-4 pl-0 min-w-[9rem] text-left font-medium text-caption" scope="col">Product</th>
                <th className="px-4 py-3 pb-4 text-right font-medium text-caption" scope="col">$/mo</th>
                <th className="px-4 py-3 pb-4 text-right font-medium text-caption" scope="col">tpm</th>
                <th className="px-4 py-3 pb-4 text-right font-medium text-caption" scope="col">tpm/$</th>
                <th className="px-4 py-3 pb-4 text-right font-medium text-caption" scope="col">p95</th>
                <th className="px-4 py-3 pb-4 text-right font-medium text-caption" scope="col">Clients</th>
                <th className="px-4 py-3 pb-4 text-left font-medium text-caption" scope="col">Instance</th>
                <th className="px-4 py-3 pb-4 pr-0 text-right font-medium text-caption" scope="col">Measured</th>
              </tr>
            </thead>
            <tbody ref={body}>
              {rows.map((entry) => (
                <PriceLatencyTableRow entry={entry} key={entry.published ? entry.row.provider : entry.provider} />
              ))}
            </tbody>
          </table>
        </div>
        <p className={cn(footnoteClass, "whitespace-nowrap max-lg:whitespace-normal")}>
          All prices are list prices. A month equals 730 hours.
        </p>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <Panel as="div" className={figurePanelClass}>
          <PriceLatencySpark label={view.label} row={leader} />
        </Panel>
        <Panel as="div" className={figurePanelClass}>
          <h3 className="text-body font-semibold tracking-[-0.01em]">Raw results</h3>
          <ul className="mt-3 font-mono text-[12px]/[2] text-muted-foreground">
            {rows
              .filter((entry): entry is Extract<PriceLatencyRow, { published: true }> => entry.published)
              .map((entry) => (
                <li className="break-all sm:truncate" key={entry.row.provider}>
                  <span className="text-primary">$</span> open{" "}
                  <a
                    className="text-foreground underline decoration-border underline-offset-2 fine-hover:decoration-current"
                    href={entry.row.rawHref}
                  >
                    {entry.row.rawHref.split("/results/")[1] ?? entry.row.rawHref}
                  </a>
                </li>
              ))}
          </ul>
          <p className="mt-4 text-caption leading-[1.65] text-muted-foreground">
            Each file contains the results we show on this website and additional metadata to aid reproduction of our results, such as specific commands and software versions used.
          </p>
          <div className="mt-5">
            <ActionLink href={leader?.compareHref ?? COMPARE_HREF}>Open compare</ActionLink>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function PriceLatencyTableRow({ entry }: { entry: PriceLatencyRow }) {
  if (!entry.published) {
    return (
      <tr className="border-t border-border" data-flip={entry.provider}>
        <th className="py-[18px] pr-4 pl-0 text-left font-medium text-muted-foreground" scope="row">
          <span className="flex min-w-[9rem] items-center gap-2.5">
            <ProviderLogo className="size-5 shrink-0 opacity-50" provider={entry.provider as ColumnProvider} />
            <span>{entry.name}</span>
          </span>
        </th>
        <td className="px-4 py-[18px] pr-0 text-left text-muted-foreground" colSpan={7}>
          Not measured
        </td>
      </tr>
    );
  }

  const row = entry.row;
  return (
    <tr className="border-t border-border" data-flip={row.provider}>
      <th className="py-[18px] pr-4 pl-0 text-left font-medium" scope="row">
        <Link className="flex min-w-[9rem] items-center gap-2.5 fine-hover:text-primary" href={row.compareHref}>
          <ProviderLogo className="size-5 shrink-0" provider={row.provider as ColumnProvider} />
          <span>{row.name}</span>
        </Link>
      </th>
      <td className="px-4 text-right font-mono text-[13px] tabular-nums"><SwapText value={formatListPrice(row.monthlyUsd)} /></td>
      <td className="px-4 text-right font-mono text-[13px] tabular-nums"><SwapText value={formatValue(row.tpm)} /></td>
      <td className="px-4 text-right font-mono text-[13px] tabular-nums"><SwapText value={formatValue(row.perDollar)} /></td>
      <td className="px-4 text-right font-mono text-[13px] tabular-nums"><SwapText value={formatLatency(row.p95)} /></td>
      <td className="px-4 text-right font-mono text-[13px] tabular-nums"><SwapText value={formatInteger(row.clients)} /></td>
      <td className="px-4 text-left text-caption">
        <a
          className="whitespace-nowrap underline decoration-border underline-offset-2 fine-hover:decoration-current"
          href={row.rawHref}
        >
          <SwapText align="start" value={row.instanceType} />
        </a>
      </td>
      <td className="px-4 pr-0 text-right font-mono text-[12px] tabular-nums text-muted-foreground">
        <time dateTime={row.measuredTo}><SwapText value={formatDateShort(row.measuredTo)} /></time>
      </td>
    </tr>
  );
}
