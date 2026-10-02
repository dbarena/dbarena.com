"use client";

import { useRef, useState } from "react";

import { ProviderLogo } from "@/components/provider-logo";
import { diskVariantName, type DiskVariant } from "@/lib/comparison-variants";
import { cn } from "@/lib/utils";

import { VALUE_FOOTNOTE, VALUE_SCALE_NOTE } from "./home-copy";
import { ChapterHeading, BenchmarkNotes } from "./chapter-heading";
import { ChapterRankRow, SizeControl } from "./chapter-figure";
import type { HomeChapter, HomeRow, HomeTier } from "./home-data";
import { MatrixValue } from "./matrix-value";
import { SwapText } from "./ui/swap-text";
import { standingFor, valueLeaders } from "./optimization-pair";
import { useHomeMotion } from "./home-motion";
import { Panel } from "./ui/panel";
import { useActiveMarker } from "./ui/use-active-marker";
import { useFlip } from "./ui/use-flip";
import {
  chapterClass,
  figurePanelClass,
  footnoteClass,
  providerIdentityClass,
  splitGridClass,
} from "./home-layout";

function chapterProducts(chapter: HomeChapter) {
  const seen = new Map<string, { provider: string; name: string }>();
  for (const view of chapter.tierViews) {
    for (const row of view.rows) {
      if (!seen.has(row.provider)) seen.set(row.provider, { provider: row.provider, name: row.name });
    }
  }
  return [...seen.values()];
}

type SideRow = { key: string; row: HomeRow | null; product: { provider: string; name: string } | null };

/** `view.rows` plus a placeholder for every chapter product missing at this
    size, placeholders always after every published row. */
function withMissingRows(chapter: HomeChapter, view: HomeTier): SideRow[] {
  const present: SideRow[] = view.rows.map((row) => ({ key: row.provider, row, product: null }));
  const missing: SideRow[] = chapterProducts(chapter)
    .filter((product) => !view.rows.some((row) => row.provider === product.provider))
    .map((product) => ({ key: product.provider, row: null, product }));
  return [...present, ...missing];
}

export function SideProjectChapter({ chapter }: { chapter: HomeChapter }) {
  const [tier, setTier] = useState(chapter.tierViews[0]!.tier);
  const view = chapter.tierViews.find(entry => entry.tier === tier)!;
  const rows = withMissingRows(chapter, view);
  const list = useRef<HTMLOListElement>(null);
  useFlip(list, tier);
  return <section className={cn(chapterClass, "border-t-0")} id={chapter.id} aria-labelledby={`${chapter.id}-title`}>
    <div className={splitGridClass}>
      <div>
        <ChapterHeading chapter={chapter} />
        <BenchmarkNotes chapter={chapter} />
      </div>
      <Panel as="div" ticks className={figurePanelClass}>
        <SizeControl chapter={chapter} onSelect={setTier} optimization="cost-optimized" view={view} />
        <p className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-note leading-[1.6] text-muted-foreground">{view.label} · {view.instanceSpec} <span>{VALUE_SCALE_NOTE}</span></p>
        <ol className="mt-2.5 [&>li+li]:border-t [&>li+li]:border-border" aria-label={`Value ranking at ${view.label}`} ref={list}>
          {rows.map(({ row, key, product }) => <li data-flip={key} key={key}>
            <ChapterRankRow
              compareHref={row ? row.compareHref : null}
              enabled={false}
              leader={row != null && row.rank === 1 && row.perDollar != null && row.perDollar > 0}
              monthlyUsd={row ? row.monthlyUsd : null}
              name={row ? row.name : product!.name}
              perDollar={row ? row.perDollar : null}
              provider={row ? row.provider : product!.provider}
              rank={row != null && row.perDollar != null && row.perDollar > 0 ? row.rank : null}
              share={null}
              sizeLabel={view.label}
            />
          </li>)}
        </ol>
        <p className={footnoteClass}>{VALUE_FOOTNOTE}</p>
      </Panel>
    </div>
  </section>;
}

export function ProductionChapter({ chapter }: { chapter: HomeChapter }) {
  const [tier, setTier] = useState(chapter.tierViews[0]!.tier);
  const [optimization, setOptimization] = useState<DiskVariant>("cost-optimized");
  const view = chapter.tierViews.find(entry => entry.tier === tier)!;
  const providers = [...new Map(chapter.tierViews.flatMap(v => v.rows).map(row => [row.provider, row])).values()];
  // One highlight behind the table slides to the selected column, instead
  // of every cell in two columns swapping its own background.
  const matrix = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  useActiveMarker(matrix, marker, { axis: "x", dependency: tier, selector: 'th[data-selected="true"]' });
  // Below md the table collapses to a single visible column anyway, so it
  // renders as the same ranked list the other chapters use at that width.
  const sideRows = withMissingRows(chapter, view);
  const rankedRows = sideRows
    .filter((entry) => entry.row)
    .map((entry) => ({ entry, standing: standingFor(entry.row!, optimization) }))
    .sort((left, right) => (right.standing.perDollar ?? 0) - (left.standing.perDollar ?? 0));
  const missingRows = sideRows.filter((entry) => !entry.row);
  const { enabled } = useHomeMotion();
  const list = useRef<HTMLOListElement>(null);
  useFlip(list, `${tier}:${optimization}`);
  return <section className={chapterClass} id={chapter.id} aria-labelledby={`${chapter.id}-title`}>
    <ChapterHeading chapter={chapter} />
    <Panel as="div" ticks className={cn(figurePanelClass, "mt-7")}>
      <SizeControl chapter={chapter} onSelect={setTier} onSelectOptimization={setOptimization} optimization={optimization} view={view} />
      <ol className="mt-2.5 [&>li+li]:border-t [&>li+li]:border-border md:hidden" aria-label={`Value ranking at ${view.label}`} ref={list}>
        {rankedRows.map(({ entry, standing }, index) => <li data-flip={entry.key} key={entry.key}>
          <ChapterRankRow
            compareHref={standing.compareHref}
            enabled={enabled}
            leader={index === 0 && (standing.perDollar ?? 0) > 0}
            monthlyUsd={entry.row!.monthlyUsd}
            name={entry.row!.name}
            perDollar={standing.perDollar}
            provider={entry.row!.provider}
            rank={(standing.perDollar ?? 0) > 0 ? index + 1 : null}
            share={null}
            sizeLabel={view.label}
          />
        </li>)}
        {missingRows.map(({ key, product }) => <li data-flip={key} key={key}>
          <ChapterRankRow
            compareHref={null}
            enabled={enabled}
            leader={false}
            monthlyUsd={null}
            name={product!.name}
            perDollar={null}
            provider={product!.provider}
            rank={null}
            share={null}
            sizeLabel={view.label}
          />
        </li>)}
      </ol>
      <div className="hidden overflow-x-auto focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring md:block" tabIndex={0} role="region" aria-label="Value across production sizes">
        <div className="relative isolate" ref={matrix}>
        <span aria-hidden="true" className="matrix-marker" ref={marker} />
        <table className="w-full min-w-[560px] border-collapse text-caption max-md:min-w-0">
          <caption className="sr-only">{optimizationExplainerCaption(optimization)} Cache-fit tpm/$ of monthly list price. Higher is better.</caption>
          <thead><tr>
            <th className="py-3 pr-4 pb-4 pl-0 text-left font-medium text-caption max-md:px-2" scope="col">Product <span className="mt-1.5 block text-note font-normal text-muted-foreground">Value · tpm/$</span></th>
            {chapter.tierViews.map(v => (
              <th
                className={cn(
                  "whitespace-nowrap px-4 py-3 pb-4 text-right font-medium text-caption max-md:px-2",
                  v.tier !== tier && "max-md:hidden",
                )}
                data-selected={v.tier === tier || undefined}
                key={v.tier}
                scope="col"
              >{v.label}<span className="ml-1.5 inline text-note font-normal text-muted-foreground before:mr-1.5 before:content-['·']">{v.instanceSpec}</span></th>
            ))}
            <th className="hidden py-3 pr-0 pb-4 pl-4 text-left font-medium text-caption lg:table-cell" scope="col"><span className="inline-block w-[150px]">Instance</span></th>
          </tr></thead>
          <tbody>{providers.map(provider => <tr className="border-t border-border" key={provider.provider}>
            <th className="py-[18px] pr-4 pl-0 text-left font-medium max-md:px-2" scope="row"><span className={providerIdentityClass}><ProviderLogo className="size-5" provider={provider.provider} />{provider.name}</span></th>
            {chapter.tierViews.map(v => {
              const row = v.rows.find(r => r.provider === provider.provider);
              const selected = v.tier === tier;
              const cellClass = cn(
                "px-4 text-right font-mono text-[14px] transition-colors duration-fast ease-exit max-md:px-2",
                !selected && "max-md:hidden",
              );
              if (!row) return <td className={cellClass} key={v.tier}><span aria-label="Not measured">—</span></td>;
              const standing = standingFor(row, optimization);
              const leads = valueLeaders(v.rows, optimization).has(row.provider);
              return <td className={cn(cellClass, leads && "text-primary")} key={v.tier}>
                <MatrixValue href={standing.compareHref} instanceType={row.instanceType} label={v.label} leads={leads} monthlyUsd={row.monthlyUsd} name={row.name} perDollar={standing.perDollar} />
              </td>;
            })}
            <td className="hidden py-[18px] pr-0 pl-4 text-left font-mono text-[11px] whitespace-nowrap text-muted-foreground lg:table-cell">
              <span className="inline-block w-[150px] overflow-hidden text-ellipsis align-top">
                <SwapText align="start" value={view.rows.find((r) => r.provider === provider.provider)?.instanceType ?? "—"} />
              </span>
            </td>
          </tr>)}</tbody>
        </table>
        </div>
      </div>
      <p className={footnoteClass}>{VALUE_FOOTNOTE}</p>
    </Panel>
    <BenchmarkNotes chapter={chapter} />
  </section>;
}

function optimizationExplainerCaption(optimization: DiskVariant) {
  return `I/O setup: ${diskVariantName(optimization)}.`;
}

export function HeavyChapter({ chapter }: { chapter: HomeChapter }) {
  const [tier, setTier] = useState(chapter.tierViews.at(-1)!.tier);
  const [optimization, setOptimization] = useState<DiskVariant>("cost-optimized");
  const view = chapter.tierViews.find(entry => entry.tier === tier)!;
  const rows = [...view.rows]
    .map((row) => ({ row, standing: standingFor(row, optimization) }))
    .sort((left, right) => (right.standing.perDollar ?? 0) - (left.standing.perDollar ?? 0));
  const leader = rows[0]?.standing;
  const { enabled } = useHomeMotion();
  const list = useRef<HTMLOListElement>(null);
  useFlip(list, `${tier}:${optimization}`);
  return <section className={chapterClass} id={chapter.id} aria-labelledby={`${chapter.id}-title`}>
    <div className={splitGridClass}>
      <div>
        <ChapterHeading chapter={chapter} />
        <BenchmarkNotes chapter={chapter} />
      </div>
      <Panel as="div" ticks className={figurePanelClass}>
        <SizeControl chapter={chapter} onSelect={setTier} onSelectOptimization={setOptimization} optimization={optimization} view={view} />
        <p className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-note leading-[1.6] text-muted-foreground">{view.label} · {view.instanceSpec} <span>{VALUE_SCALE_NOTE}</span></p>
        <ol className="mt-2.5 [&>li+li]:border-t [&>li+li]:border-border" ref={list}>
          {rows.map(({ row, standing }, index) => {
            const share = leader && (leader.perDollar ?? 0) > 0 ? (standing.perDollar ?? 0) / (leader.perDollar ?? 1) * 100 : 0;
            return <li data-flip={row.provider} key={row.provider}>
              <ChapterRankRow
                compareHref={standing.compareHref}
                enabled={enabled}
                leader={index === 0}
                monthlyUsd={row.monthlyUsd}
                name={row.name}
                perDollar={standing.perDollar}
                provider={row.provider}
                rank={index + 1}
                share={share}
                sizeLabel={view.label}
              />
            </li>;
          })}
        </ol>
        <p className={footnoteClass}>{VALUE_FOOTNOTE}</p>
      </Panel>
    </div>
  </section>;
}

export function EditorialChapter({ chapter }: { chapter: HomeChapter }) {
  if (chapter.id === "production") return <ProductionChapter chapter={chapter} />;
  if (chapter.id === "heavy") return <HeavyChapter chapter={chapter} />;
  return <SideProjectChapter chapter={chapter} />;
}
