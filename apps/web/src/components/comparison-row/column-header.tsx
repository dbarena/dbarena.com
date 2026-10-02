"use client";

import { ArrowUpRightIcon, GripVerticalIcon, XIcon } from "lucide-react";
import * as m from "motion/react-m";
import { useRef } from "react";
import type { Ref } from "react";

import type { ColumnDrag } from "@/components/comparison-row/use-column-drag";

import {
  type BoundType,
  type ColumnProvider,
  type ColumnTier,
} from "@/lib/catalog";
import { NoteHint } from "@/components/comparison-row/metric-hint";
import {
  useColumnEnter,
  useColumnPresence,
} from "@/components/comparison-row/comparison-motion";
import { ColumnFilters } from "@/components/comparison-row/column-filters";
import { comparisonName } from "@/lib/comparison-providers";
import { ProviderPicker } from "@/components/comparison-row/provider-picker";
import { Button } from "@/components/ui/button";
import type { BenchmarkSummary } from "@/lib/benchmarks";
import { githubResultHref } from "@/lib/site-links";
import { cn, textLinkClass } from "@/lib/utils";

import { COMPARISON_CELL_PAD_CLASS, COMPARISON_COLUMN_CLASS } from "./layout";

const measuredOn = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function ColumnHeader({
  animateEnter,
  benchmark,
  benchmarks,
  boundType,
  canRemove,
  columnDrag,
  columnId,
  columnIndex,
  columnOrder,
  layoutKey,
  note,
  occupied,
  onRemove,
  onSelectConfiguration,
  provider,
  ref,
  tier,
  variant,
}: {
  animateEnter: boolean;
  benchmark: BenchmarkSummary;
  benchmarks: BenchmarkSummary[];
  boundType: BoundType;
  canRemove: boolean;
  columnDrag: ColumnDrag | null;
  columnId: string;
  columnIndex: number;
  columnOrder: readonly string[];
  layoutKey: string;
  note: string | null;
  occupied: ReadonlySet<string>;
  onRemove: () => void;
  onSelectConfiguration: (provider: ColumnProvider, tier: ColumnTier, variant?: string | null) => void;
  provider: ColumnProvider;
  ref?: Ref<HTMLElement>;
  tier: ColumnTier;
  variant: string | null;
}) {
  const presence = useColumnPresence(layoutKey);
  // The header is beat 0 of the cascade that fills a newly added column.
  const enter = useColumnEnter(0, animateEnter);
  const sectionRef = useRef<HTMLElement>(null);
  const isDragging = columnDrag?.draggingId === columnId;
  const rawHref = githubResultHref(benchmark.path);
  const name = comparisonName(benchmark);

  const removeButton = canRemove ? (
    <Button
      aria-label={`Remove ${name} ${tier}`}
      className="size-11 text-muted-foreground sm:size-10 md:size-8"
      onClick={onRemove}
      size="icon"
      title="Remove from comparison"
      variant="ghost"
    >
      <XIcon aria-hidden="true" className="size-4" />
    </Button>
  ) : null;

  const canReorder = Boolean(columnDrag) && columnOrder.length > 1;
  const dragHandle = canReorder ? (
    <button
      // Pointer dragging is the obvious affordance; the arrow keys are the one
      // that has to be announced, so the grip carries both.
      aria-keyshortcuts="ArrowLeft ArrowRight"
      aria-label={`Reorder ${name} ${tier}, column ${columnIndex + 1} of ${columnOrder.length}`}
      className={cn(
        "flex size-8 shrink-0 touch-none cursor-grab items-center justify-center rounded-md",
        "text-muted-foreground/50 transition-[color,background-color,transform] duration-fast ease-exit",
        "fine-hover:bg-muted/60 fine-hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "active:scale-90 active:cursor-grabbing",
        isDragging && "cursor-grabbing bg-muted/60 text-foreground",
      )}
      onKeyDown={(event) => {
        const direction = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
        if (!direction || event.metaKey || event.ctrlKey || event.altKey) return;
        if (columnDrag?.moveByKeyboard(columnId, columnOrder, direction, `${name} ${tier}`)) {
          event.preventDefault();
        }
      }}
      onPointerDown={(event) =>
        columnDrag?.startDrag(columnId, columnOrder, event, sectionRef.current)
      }
      title="Drag to reorder, or use the arrow keys"
      type="button"
    >
      <GripVerticalIcon aria-hidden="true" className="size-4" />
    </button>
  ) : null;

  return (
    <m.section
      animate={presence.animate}
      aria-label={`${name} ${tier}`}
      className={cn(
        COMPARISON_COLUMN_CLASS,
        "@container/column relative justify-start gap-0 py-3",
      )}
      data-comparison-id={columnId}
      exit={presence.exit}
      initial={presence.initial}
      layout={presence.layout}
      layoutDependency={presence.layoutDependency}
      ref={(node) => {
        sectionRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      role="columnheader"
      // Under the sticky row label (z-20), over the columns it travels across.
      style={{ x: columnDrag?.dragX(columnId), zIndex: isDragging ? 10 : undefined }}
      transition={presence.transition}
    >
      {/* Travelling surface. Without it the moving column is transparent and
          its text collides with whatever it is passing over. */}
      {isDragging && columnDrag ? (
        <m.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-background"
          style={{ opacity: columnDrag.lift }}
        />
      ) : null}
      <m.div
        animate={enter.content.animate}
        className="relative flex min-h-0 flex-1 flex-col"
        initial={enter.content.initial}
        transition={enter.content.transition}
      >
        <div className={cn("flex items-start justify-between gap-1", COMPARISON_CELL_PAD_CLASS)}>
          <div className="flex min-w-0 items-start gap-0.5">
            <ProviderPicker
              benchmarks={benchmarks}
              boundType={boundType}
              columnNumber={columnIndex + 1}
              host={benchmark.host}
              occupied={occupied}
              onSelectConfiguration={onSelectConfiguration}
              provider={provider}
              tier={tier}
              variant={variant}
            />
          </div>
          {/* Two-up columns on phones leave no room beside the provider name; the
              remove control drops to the meta row there and returns beside the
              name on wider screens. */}
          <span className="-mr-2.5 -mt-1.5 hidden md:inline-flex">{removeButton}</span>
        </div>
        <div className={COMPARISON_CELL_PAD_CLASS}>
          <ColumnFilters
            benchmarks={benchmarks}
            boundType={boundType}
            columnNumber={columnIndex + 1}
            host={benchmark.host}
            occupied={occupied}
            onSelectConfiguration={onSelectConfiguration}
            provider={provider}
            tier={tier}
            variant={variant}
          />
        </div>
        <div
          className={cn(
            "mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-[11px] text-muted-foreground",
            COMPARISON_CELL_PAD_CLASS,
          )}
        >
          <time className="font-mono" dateTime={benchmark.measuredTo}>
            {measuredOn.format(new Date(benchmark.measuredTo))}
          </time>
          <a
            aria-label={`Raw result for ${name} ${tier} (opens in a new tab)`}
            className={cn(
              textLinkClass,
              "group/result inline-flex min-h-11 items-center no-underline sm:min-h-0",
            )}
            href={rawHref}
            rel="noreferrer"
            target="_blank"
          >
            <span className="inline-flex items-center gap-0.5 border-b border-border group-hover/result:border-foreground">
              Raw result
              <ArrowUpRightIcon aria-hidden="true" className="size-3" strokeWidth={2} />
            </span>
          </a>
          {note ? <NoteHint note={note} /> : null}
          {/* The grip sits in the corner under the remove control, so the two
              things you do to a column as a whole share one edge and the
              provider name keeps the column's left margin. Only desktop's
              flexed, non-scrolling columns are draggable; the handle stays
              hidden on the mobile snap rail so it can't fight the native
              horizontal swipe-to-scroll gesture. */}
          <span className="-my-2 -mr-2.5 ml-auto hidden md:inline-flex">{dragHandle}</span>
          <span className="-my-2.5 -mr-2.5 ml-auto inline-flex md:hidden">{removeButton}</span>
        </div>
      </m.div>
    </m.section>
  );
}
