"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, LazyMotion, MotionConfig, domMax } from "motion/react";
import * as m from "motion/react-m";

import { NewOrderOverlay } from "@/components/comparison-charts/new-order-overlay";
import { ColumnHeader } from "@/components/comparison-row/column-header";
import { CompareToolbar } from "@/components/comparison-row/compare-toolbar";
import { ConfigurationChooserDialog } from "@/components/comparison-row/configuration-chooser";
import {
  COLUMN_PRESENCE_MODE,
  columnLayoutKey,
  useMountedGrid,
} from "@/components/comparison-row/comparison-motion";
import {
  COMPARISON_ROW_CLASS,
  COMPARISON_STACK_CLASS,
  COMPARISON_STUB_CLASS,
} from "@/components/comparison-row/layout";
import { MetricGrid } from "@/components/comparison-row/metric-grid";
import { useColumnDrag } from "@/components/comparison-row/use-column-drag";
import { useColumnPager } from "@/components/comparison-row/use-column-pager";
import { useComparisonColumns } from "@/components/comparison-row/use-comparison-columns";
import type { BenchmarkSummary } from "@/lib/benchmarks";
import {
  TIER_OPTIONS,
  type BoundType,
  type ColumnIdentity,
  type ColumnTier,
} from "@/lib/catalog";
import { comparisonName } from "@/lib/comparison-providers";
import { diskVariantName, isDiskVariant } from "@/lib/comparison-variants";
import { providerNoteLine } from "@/lib/provider-note-text";
import { cn } from "@/lib/utils";

function tierLabel(tier: ColumnTier) {
  return TIER_OPTIONS.find((option) => option.id === tier)?.label ?? tier;
}

function overlayName(
  column: { provider: string; tier: ColumnTier; variant: string | null; benchmark: { host: string; provider: string } },
  columns: Array<{ id: string; provider: string; tier: ColumnTier; variant: string | null }>,
  mixedTiers: boolean,
) {
  const base = mixedTiers
    ? `${comparisonName(column.benchmark)} ${tierLabel(column.tier)}`
    : comparisonName(column.benchmark);
  const needsVariant =
    isDiskVariant(column.variant) &&
    columns.some(
      (other) =>
        other.provider === column.provider &&
        other.tier === column.tier &&
        other.variant !== column.variant,
    );
  if (!needsVariant || !isDiskVariant(column.variant)) return base;
  return `${base} · ${diskVariantName(column.variant)}`;
}

export function CompareView({
  benchmarks,
  initialBoundType,
  initialColumns,
  providerNotes,
}: {
  benchmarks: BenchmarkSummary[];
  initialBoundType: BoundType;
  initialColumns: ColumnIdentity[];
  providerNotes: Record<string, string>;
}) {
  const {
    append,
    boundType,
    canAdd,
    changeBoundType,
    columns,
    lockedTier,
    lockSizes,
    occupied,
    occupiedExcept,
    railRef,
    remove,
    reorder,
    setLockSizes,
    synced,
    update,
  } = useComparisonColumns({ benchmarks, initialBoundType, initialColumns });
  const [chooserOpen, setChooserOpen] = useState(false);
  const [showDifferences, setShowDifferences] = useState(false);
  const pager = useColumnPager(railRef, columns.length);
  const columnDrag = useColumnDrag(reorder);
  // Columns present on load are just the page; only columns the reader adds
  // earn the enter cascade.
  const animateEnter = useMountedGrid();

  const columnIds = useMemo(() => columns.map((column) => column.id), [columns]);
  const layoutKey = columnLayoutKey(columnIds);
  const mixedTiers = columns.some((column) => column.tier !== columns[0]?.tier);
  const overlayColumns = useMemo(
    () =>
      columns.map((column) => ({
        id: column.id,
        name: overlayName(column, columns, mixedTiers),
        provider: column.provider,
        clients: column.benchmark.terminalConcurrency,
        tpm: column.benchmark.terminalThroughput,
        series: column.benchmark.newOrderSeries,
      })),
    [columns, mixedTiers],
  );
  const gridColumns = useMemo(
    () =>
      columns.map((column) => ({
        id: column.id,
        benchmark: column.benchmark,
      })),
    [columns],
  );

  return (
    <LazyMotion features={domMax} strict>
    <MotionConfig reducedMotion="user">
      <ConfigurationChooserDialog
        benchmarks={benchmarks}
        boundType={boundType}
        lockedTier={lockedTier}
        occupied={occupied}
        onOpenChange={setChooserOpen}
        onSelectConfiguration={append}
        open={chooserOpen}
        preferredTier={columns[0]?.tier ?? "large"}
      />

        <main
          className="arena-canvas flex min-h-[calc(100dvh-var(--site-header-h,3.5rem))] w-full flex-1 flex-col max-md:pb-[var(--compare-dock-h)]"
          id="main"
        >
          <CompareToolbar
            boundType={boundType}
            canAdd={canAdd}
            columns={columns}
            dialogOpen={chooserOpen}
            lockSizes={lockSizes}
            onAdd={() => setChooserOpen(true)}
            onBoundTypeChange={changeBoundType}
            onLockSizesChange={setLockSizes}
            pager={pager}
            synced={synced}
          />

          {columns.length === 0 ? (
            <p className="grid flex-1 place-items-center px-page text-center text-sm text-muted-foreground">
              Nothing measured for this combination. Change the scenario or add a configuration.
            </p>
          ) : (
            <>
              <div
                className="relative w-full snap-x snap-mandatory overflow-x-auto [scroll-padding-left:6.5rem] [scrollbar-width:none] md:snap-none md:overflow-visible"
                id="comparison-panels"
                ref={railRef}
              >
                <LayoutGroup>
                  <div
                    aria-label="Database configuration comparison"
                    // Positioned so the drag chrome below can be measured and
                    // placed in this element's coordinate space.
                    className={cn(
                      COMPARISON_STACK_CLASS,
                      "relative",
                      showDifferences && columns.length > 1 && "[--comparison-column-min:16rem]",
                    )}
                    role="table"
                  >
                    {/* Drag chrome. Two full-height overlays instead of per-cell
                        treatments: the column reads as one rigid slab with one
                        continuous shadow, and the slot it left behind reads as
                        an empty well rather than a hole in the table. */}
                    {columnDrag.slab ? (
                      <>
                        <m.div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 z-0 bg-[var(--drop-well)]"
                          style={{
                            left: columnDrag.slab.left,
                            opacity: columnDrag.lift,
                            width: columnDrag.slab.width,
                            x: columnDrag.wellX,
                          }}
                        />
                        <m.div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 z-10 rounded-[var(--radius)] ring-1 ring-[var(--drag-edge)] shadow-[var(--drag-slab-shadow)]"
                          style={{
                            left: columnDrag.slab.left,
                            opacity: columnDrag.lift,
                            width: columnDrag.slab.width,
                            x: columnDrag.slabX,
                          }}
                        />
                      </>
                    ) : null}
                    <div className={cn(COMPARISON_ROW_CLASS, "border-b border-border")} role="row">
                      <div className={cn(COMPARISON_STUB_CLASS, "justify-between gap-3 pt-3")} role="columnheader">
                        <span className="text-xs text-muted-foreground">
                          Configuration
                        </span>
                        <label className="mx-auto flex min-h-11 w-fit cursor-pointer items-center justify-center gap-1.5 text-[11px] leading-snug text-foreground sm:min-h-8 sm:text-xs has-disabled:cursor-default has-disabled:opacity-50">
                          <input
                            aria-controls="comparison-metrics"
                            aria-label="Show differences from row leaders"
                            checked={showDifferences && columns.length > 1}
                            className="size-3.5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            disabled={columns.length < 2}
                            onChange={(event) => setShowDifferences(event.target.checked)}
                            type="checkbox"
                          />
                          <span className="sm:hidden">Differences</span>
                          <span className="hidden sm:inline">Show differences</span>
                        </label>
                      </div>
                      <AnimatePresence initial={false} mode={COLUMN_PRESENCE_MODE}>
                        {columns.map((column, index) => (
                          <ColumnHeader
                            animateEnter={animateEnter}
                            benchmark={column.benchmark}
                            benchmarks={benchmarks}
                            boundType={boundType}
                            canRemove={columns.length > 1}
                            columnDrag={columnDrag}
                            columnId={column.id}
                            columnIndex={index}
                            columnOrder={columnIds}
                            key={column.id}
                            layoutKey={layoutKey}
                            note={
                              providerNotes[column.provider]
                                ? providerNoteLine(providerNotes[column.provider]!)
                                : null
                            }
                            occupied={occupiedExcept(column.id)}
                            onRemove={() => remove(column.id)}
                            onSelectConfiguration={(provider, tier, variant) =>
                              update(column.id, { provider, tier, variant })
                            }
                            provider={column.provider}
                            tier={column.tier}
                            variant={column.variant}
                          />
                        ))}
                      </AnimatePresence>
                    </div>

                    <MetricGrid
                      animateEnter={animateEnter}
                      boundType={boundType}
                      columnDrag={columnDrag}
                      columns={gridColumns}
                      showDifferences={showDifferences && columns.length > 1}
                    />
                  </div>
                </LayoutGroup>
              </div>

              {/* Keyboard reordering has no motion to watch, so it gets said. */}
              <p aria-live="polite" className="sr-only" role="status">
                {columnDrag.status}
              </p>

              {/* Remount only when configurations are added or removed, not
                  when the reader reorders them or swaps a size/provider -
                  those should update the existing chart in place instead of
                  flashing a fresh one. */}
              <NewOrderOverlay
                columns={overlayColumns}
                key={`${boundType}:${columns
                  .map((column) => column.id)
                  .sort()
                  .join(",")}`}
              />
            </>
          )}
        </main>
      </MotionConfig>
    </LazyMotion>
  );
}
