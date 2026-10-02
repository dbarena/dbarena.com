"use client";

import { AnimatePresence, type MotionValue } from "motion/react";
import * as m from "motion/react-m";
import type { ReactNode, Ref } from "react";

import type { BoundType } from "@/lib/catalog";
import {
  formatGap,
  leadForRow,
  metricRows,
  type MetricRow,
  type TableColumn,
} from "@/components/comparison-row/comparison-metrics";
import {
  COLUMN_PRESENCE_MODE,
  columnLayoutKey,
  useColumnEnter,
  useColumnPresence,
} from "@/components/comparison-row/comparison-motion";
import type { ColumnDrag } from "@/components/comparison-row/use-column-drag";
import { cn } from "@/lib/utils";

import {
  COMPARISON_CELL_PAD_CLASS,
  COMPARISON_COLUMN_CLASS,
  COMPARISON_ROW_CLASS,
  COMPARISON_STACK_CLASS,
  COMPARISON_STUB_CLASS,
} from "./layout";
import { MetricHint } from "./metric-hint";

// Written out in full: Tailwind scans source text, so these have to be literal.
const ROW_HOVER =
  "fine-hover:bg-[color-mix(in_oklab,var(--background),var(--muted)_30%)]";
const STUB_HOVER =
  "[@media(hover:hover)_and_(pointer:fine)]:group-hover:bg-[color-mix(in_oklab,var(--background),var(--muted)_30%)]";
// A dragged column turns opaque, so its surface has to restate whatever tint the
// row underneath it was contributing - otherwise hero rows show a hole.
const HERO_SURFACE = "bg-[color-mix(in_oklab,var(--background),var(--muted)_20%)]";

function LeaderLabel({ tied }: { tied: boolean }) {
  return (
    <span
      className="shrink-0 rounded-sm bg-primary/10 px-1 py-0.5 text-[10px] font-medium leading-4 text-[var(--leader-chip)]"
    >
      <span aria-hidden="true">
        {tied ? (
          <>
            <span className="sm:hidden">Tied</span>
            <span className="hidden sm:inline">Tied lead</span>
          </>
        ) : "Leads"}
      </span>
      <span className="sr-only">{tied ? "Joint row leader" : "Row leader"}</span>
    </span>
  );
}

function valueClass(weight: MetricRow["weight"], isBest: boolean) {
  switch (weight) {
    case "hero":
      return "text-[17px] font-medium text-foreground";
    case "metric":
      return cn("text-[15px] text-foreground", isBest && "font-medium");
    case "fact":
      return "text-[13px] text-pretty break-words text-muted-foreground";
    default: {
      const exhaustive: never = weight;
      return exhaustive;
    }
  }
}

function MetricCell({
  animateEnter,
  children,
  layoutKey,
  isLeader,
  dragX,
  isDragging,
  lift,
  ref,
  rowIndex,
  surfaceClass,
}: {
  animateEnter: boolean;
  children: ReactNode;
  layoutKey: string;
  isLeader: boolean;
  dragX?: MotionValue<number>;
  isDragging: boolean;
  lift?: MotionValue<number>;
  ref?: Ref<HTMLDivElement>;
  rowIndex: number;
  surfaceClass: string;
}) {
  const presence = useColumnPresence(layoutKey);
  const enter = useColumnEnter(rowIndex, animateEnter);
  return (
    <m.div
      animate={presence.animate}
      className={cn(
        COMPARISON_COLUMN_CLASS,
        COMPARISON_CELL_PAD_CLASS,
        "relative min-h-11 flex-col justify-start gap-1 py-2.5",
      )}
      exit={presence.exit}
      initial={presence.initial}
      layout={presence.layout}
      layoutDependency={presence.layoutDependency}
      ref={ref}
      role="cell"
      style={{ x: dragX, zIndex: isDragging ? 10 : undefined }}
      transition={presence.transition}
    >
      {isDragging && lift ? (
        <m.span
          aria-hidden="true"
          className={cn("pointer-events-none absolute inset-0", surfaceClass)}
          style={{ opacity: lift }}
        />
      ) : null}
      {/* Layered rather than set as the cell background so it still reads on
          top of the opaque surface a dragged column carries with it. */}
      {isLeader ? (
        <m.span
          animate={enter.surface.animate}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[var(--leader-wash)]"
          initial={enter.surface.initial}
          transition={enter.surface.transition}
        />
      ) : null}
      <m.div
        animate={enter.content.animate}
        className="relative flex min-w-0 items-center gap-x-2"
        initial={enter.content.initial}
        transition={enter.content.transition}
      >
        {children}
      </m.div>
    </m.div>
  );
}

export function MetricGrid({
  animateEnter,
  boundType,
  columnDrag,
  columns,
  showDifferences,
}: {
  animateEnter: boolean;
  boundType: BoundType;
  columnDrag: ColumnDrag | null;
  columns: TableColumn[];
  showDifferences: boolean;
}) {
  const rows = metricRows(boundType);
  const layoutKey = columnLayoutKey(columns.map((column) => column.id));
  // A row wash that lights up under the cursor while a column is mid-flight
  // reads as flicker, not feedback.
  const quietHover = Boolean(columnDrag?.draggingId);

  return (
    <div className={COMPARISON_STACK_CLASS} id="comparison-metrics" role="rowgroup">
      {rows.map((row, rowIndex) => {
        const hint = row.higherWins != null
          ? `${row.hint} ${row.higherWins ? "Higher" : "Lower"} is better.`
          : row.hint;

        return (
          <div
            className={cn(
              COMPARISON_ROW_CLASS,
              "group border-b border-border/60 transition-[background-color] duration-fast ease-exit",
              !quietHover && ROW_HOVER,
              row.weight === "hero" && "bg-muted/20",
            )}
            key={row.id}
            role="row"
          >
            {/* Keep the sticky label opaque when columns scroll underneath it. */}
            <div
              className={cn(
                COMPARISON_STUB_CLASS,
                "py-0 transition-[background-color] duration-fast ease-exit",
                !quietHover && STUB_HOVER,
              )}
              role="rowheader"
            >
              <MetricHint
                hint={hint}
                label={row.label}
              />
            </div>
            <AnimatePresence initial={false} mode={COLUMN_PRESENCE_MODE}>
              {columns.map((column) => {
                const lead = leadForRow(row, columns, column);
                const isBest = lead?.kind === "best" || lead?.kind === "tied";
                const gap = lead?.kind === "behind" && row.showBehind
                  ? formatGap(row, lead.value, lead.bestValue)
                  : null;

                return (
                  <MetricCell
                    animateEnter={animateEnter}
                    dragX={columnDrag?.dragX(column.id)}
                    isDragging={columnDrag?.draggingId === column.id}
                    isLeader={isBest}
                    key={column.id}
                    layoutKey={layoutKey}
                    lift={columnDrag?.lift}
                    // Beat 0 is the header, so the first metric row is beat 1.
                    rowIndex={rowIndex + 1}
                    surfaceClass={row.weight === "hero" ? HERO_SURFACE : "bg-background"}
                  >
                    <span className={cn(
                      "min-w-0 font-mono tracking-tight",
                      row.weight !== "fact" && "shrink-0 whitespace-nowrap",
                      valueClass(row.weight, isBest),
                    )}>
                      {row.display(column)}
                    </span>
                    {isBest ? <LeaderLabel tied={lead.kind === "tied"} /> : null}
                    {showDifferences && gap ? (
                      <span className="shrink-0 whitespace-nowrap text-[12px] text-muted-foreground">{gap}</span>
                    ) : null}
                  </MetricCell>
                );
              })}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
