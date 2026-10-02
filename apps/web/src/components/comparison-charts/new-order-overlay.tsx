"use client";

import { memo, useMemo, useState } from "react";

import { NewOrderChart } from "@/components/comparison-charts/new-order-chart";
import { ChartProducts, NewOrderLegend } from "@/components/comparison-charts/new-order-legend";
import {
  chartXMax,
  formatClients,
  formatMinutes,
  mergeSeries,
  overlaySummary,
  rollingMedian,
  yTicks,
  type OverlayColumn,
} from "@/components/comparison-charts/overlay-series";
import { MetricHint } from "@/components/comparison-row/metric-hint";
import { Button } from "@/components/ui/button";

export type { OverlayColumn };

function NewOrderOverlayView({ columns }: { columns: OverlayColumn[] }) {
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(new Set());
  const smoothedColumns = useMemo(
    () => columns.map((column) => ({
      ...column,
      series: column.series ? rollingMedian(column.series) : null,
    })),
    [columns],
  );
  const visibleColumns = smoothedColumns.filter((column) => !hiddenIds.has(column.id));
  const mixedClients = visibleColumns.some(
    (column) => column.clients !== visibleColumns[0]?.clients,
  );
  const plotted = visibleColumns.filter((column) => column.series?.length);
  // Hidden columns stay mounted (never dropped from renderColumns) so toggling
  // a product fades its line in/out instead of popping it in/out of the DOM.
  const renderColumns = smoothedColumns.filter((column) => column.series?.length);
  const rows = mergeSeries(renderColumns);
  const longestEnd = rows.reduce((max, row) => Math.max(max, row.tSeconds ?? 0), 0);
  const xMax = chartXMax(longestEnd);
  const ticks = yTicks(Math.max(
    0,
    ...plotted.flatMap((column) => (column.series ?? []).map((sample) => sample.tpm)),
  ));
  const ceiling = ticks[ticks.length - 1] ?? 0;

  function toggleProduct(id: string) {
    setHiddenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function showAll() {
    setHiddenIds(new Set());
  }

  return (
    <section
      aria-describedby="new-order-summary"
      aria-labelledby="new-order-title"
      className="compare-chart compare-pinned flex w-full flex-1 flex-col gap-4 px-page py-5"
    >
      <p className="sr-only" id="new-order-summary">
        {visibleColumns.length ? overlaySummary(visibleColumns, mixedClients) : "All products are hidden from the chart."}
      </p>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium" id="new-order-title">Throughput over time</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Derived from TPC-C · {mixedClients ? "Each configuration’s own client load" : formatClients(visibleColumns[0]?.clients ?? columns[0]?.clients ?? 0)}
          </p>
        </div>
        <ChartProducts columns={columns} hiddenIds={hiddenIds} onShowAll={showAll} onToggle={toggleProduct} />
      </div>
      <NewOrderLegend columns={smoothedColumns} hiddenIds={hiddenIds} longestEnd={longestEnd} mixedClients={mixedClients} onToggle={toggleProduct} />
      <div className="flex min-h-64 flex-1 flex-col">
        {plotted.length === 0 ? (
          <div className="flex min-h-64 flex-1 flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border px-4 text-center">
            <p className="text-sm font-medium">{visibleColumns.length ? "No time samples for these products" : "All products hidden"}</p>
            <p className="text-xs text-muted-foreground">{visibleColumns.length ? "Choose another product to see its run." : "Show a product to bring its line back."}</p>
            {hiddenIds.size > 0 ? <Button className="mt-2" onClick={showAll} variant="outline">Show all products</Button> : null}
          </div>
        ) : (
          <>
            <span className="mb-3 text-[11px] text-muted-foreground">tpm</span>
            <NewOrderChart ceiling={ceiling} columns={columns} hiddenIds={hiddenIds} renderColumns={renderColumns} rows={rows} ticks={ticks} visibleColumns={plotted} xMax={xMax} />
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <MetricHint
          className="text-[11px] font-normal text-muted-foreground"
          hint="Charts use an 11-sample rolling median at each configuration's maximum concurrency."
          label="Sample rendering"
        />
        <span>Elapsed time · {formatMinutes(xMax)}</span>
      </div>
    </section>
  );
}

export const NewOrderOverlay = memo(NewOrderOverlayView);
