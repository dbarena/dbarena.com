"use client";

import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

import {
  formatBoundType,
  TIER_OPTIONS,
  type BoundType,
} from "@/lib/catalog";
import { boundCopy } from "@/components/comparison-row/comparison-metrics";
import { LockSizesToggle } from "@/components/comparison-row/lock-sizes-toggle";
import { Button } from "@/components/ui/button";
import { LOAD_INTENTS } from "@/lib/home-guide";
import { cn } from "@/lib/utils";

import type { useColumnPager } from "./use-column-pager";
import type { ResolvedColumn } from "./use-comparison-columns";

type Pager = ReturnType<typeof useColumnPager>;

function summary(columns: ResolvedColumn[], synced: boolean, boundType: BoundType) {
  const count = `${columns.length} ${columns.length === 1 ? "configuration" : "configurations"}`;
  const tierLabel = TIER_OPTIONS.find((tier) => tier.id === columns[0]?.tier)?.label;
  const size = synced && tierLabel ? `all ${tierLabel}` : "mixed sizes";
  return `${count} · ${size} · ${formatBoundType(boundType).toLowerCase()}`;
}

function CompareIdentity({
  boundType,
  className,
  columns,
  synced,
}: {
  boundType: BoundType;
  className?: string;
  columns: ResolvedColumn[];
  synced: boolean;
}) {
  return (
    <div className={className}>
      <h1 className="text-[15px] font-medium tracking-tight">Compare</h1>
      <p className="truncate text-[13px] text-muted-foreground">
        {summary(columns, synced, boundType)}
      </p>
    </div>
  );
}

export function CompareToolbar({
  boundType,
  canAdd,
  columns,
  dialogOpen = false,
  lockSizes,
  onAdd,
  onBoundTypeChange,
  onLockSizesChange,
  pager,
  synced,
}: {
  boundType: BoundType;
  canAdd: boolean;
  columns: ResolvedColumn[];
  dialogOpen?: boolean;
  lockSizes: boolean;
  onAdd: () => void;
  onBoundTypeChange: (boundType: BoundType) => void;
  onLockSizesChange: (lockSizes: boolean) => void;
  pager: Pager;
  synced: boolean;
}) {
  const identity = {
    boundType,
    columns,
    synced,
  };
  const slideEnabled = !useReducedMotion();

  return (
    <>
      <CompareIdentity className="border-b border-border px-page py-3 md:hidden" {...identity} />
      <div
        className={cn(
          "compare-pinned z-30 shrink-0 bg-background/90 px-page backdrop-blur-md",
          "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:border-t max-md:pt-2.5 max-md:pb-[max(0.625rem,env(safe-area-inset-bottom))]",
          "md:sticky md:top-[var(--site-header-h,3.5rem)] md:border-b",
          dialogOpen && "max-md:invisible",
        )}
        aria-hidden={dialogOpen || undefined}
      >
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto [scrollbar-width:none] md:flex-wrap md:gap-x-4 md:gap-y-2 md:overflow-visible md:py-3">
          <CompareIdentity className="hidden min-w-0 flex-1 basis-[14rem] md:block" {...identity} />
          <div className="flex shrink-0 items-center gap-2">
            <div
              aria-label="Load"
              className="seg h-11 p-[3px] [&>button]:h-full! [&>button]:min-h-0! max-sm:[&>button]:min-w-0! max-sm:[&>button]:px-2.5! sm:h-9"
              data-slide={slideEnabled ? "on" : undefined}
              role="group"
              style={{ "--size-count": LOAD_INTENTS.length, "--size-index": LOAD_INTENTS.indexOf(boundType) } as CSSProperties}
            >
              {slideEnabled ? <span aria-hidden="true" className="seg-pill" /> : null}
              {LOAD_INTENTS.map((option) => {
                const copy = boundCopy(option);
                return (
                  <button
                    aria-label={formatBoundType(option)}
                    aria-pressed={boundType === option}
                    className="relative outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    key={option}
                    onClick={() => onBoundTypeChange(option)}
                    title={`${formatBoundType(option)}: ${copy.hint}`}
                    type="button"
                  >
                    <span className="sm:hidden">{copy.compact}</span>
                    <span className="hidden sm:inline">{copy.label}</span>
                  </button>
                );
              })}
            </div>
            <LockSizesToggle locked={lockSizes} onChange={onLockSizesChange} />
            <Button
              aria-label="Add configuration"
              className="size-11 px-0 sm:h-9 sm:w-auto sm:px-3"
              disabled={!canAdd}
              onClick={onAdd}
              variant="outline"
            >
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
              <span aria-hidden="true" className="hidden sm:inline">Add</span>
            </Button>
          </div>
          {pager.overflows ? (
            <div aria-label="Scroll columns" className="ml-auto flex shrink-0 gap-1" role="group">
              <Button
                aria-label="Previous column"
                className="size-11 sm:size-9"
                disabled={!pager.canPrev}
                onClick={() => pager.page(-1)}
                size="icon"
                variant="outline"
              >
                <ChevronLeftIcon aria-hidden="true" />
              </Button>
              <Button
                aria-label="Next column"
                className="size-11 sm:size-9"
                disabled={!pager.canNext}
                onClick={() => pager.page(1)}
                size="icon"
                variant="outline"
              >
                <ChevronRightIcon aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
