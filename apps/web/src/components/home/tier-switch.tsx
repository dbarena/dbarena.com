"use client";

import { useRef } from "react";

import type { ColumnTier } from "@/lib/catalog";
import { cn } from "@/lib/utils";

import { ruleTabHitClass } from "./home-layout";
import type { HomeTier } from "./home-data";
import { useActiveMarker } from "./ui/use-active-marker";

export function TierSwitch({
  className,
  onSelect,
  selected,
  showInstanceSpec = true,
  tone = "seg",
  views,
}: {
  className?: string;
  onSelect: (tier: ColumnTier) => void;
  selected: ColumnTier;
  showInstanceSpec?: boolean;
  tone?: "seg" | "rule";
  views: HomeTier[];
}) {
  if (views.length < 2) return null;

  switch (tone) {
    case "rule":
      return <RuleTabs className={className} onSelect={onSelect} selected={selected} showInstanceSpec={showInstanceSpec} views={views} />;
    case "seg":
      return (
        <div aria-label="Size" className={cn("seg", className)} role="group">
          {views.map((view) => (
            <button
              aria-pressed={view.tier === selected}
              className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
              key={view.tier}
              onClick={() => onSelect(view.tier)}
              type="button"
            >
              {views.length > 3 ? view.label : view.situation}
            </button>
          ))}
        </div>
      );
    default: {
      const exhaustive: never = tone;
      return exhaustive;
    }
  }
}

function RuleTabs({
  className,
  onSelect,
  selected,
  showInstanceSpec,
  views,
}: {
  className?: string;
  onSelect: (tier: ColumnTier) => void;
  selected: ColumnTier;
  showInstanceSpec: boolean;
  views: HomeTier[];
}) {
  const group = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  // The rule slides between tabs instead of cross-fading. Measured once per
  // change and moved on `transform`; motion's shared `layoutId` would pull
  // the layout projection engine into this page for one 1px line.
  useActiveMarker(group, marker, { dependency: selected });
  return (
        <div aria-label="Size" className={cn("relative flex flex-wrap items-end gap-x-5 gap-y-1", className)} ref={group} role="group">
          <span aria-hidden="true" className="tab-marker" ref={marker} />
          {views.map((view) => {
            const active = view.tier === selected;
            // Size names first, situation as a subtitle ("Small · Side
            // project") — the reverse of the situation-only labels this used
            // to render (03-content-audit.md §4). Skipped past three tabs
            // (the disk-bound size switch, all seven sizes): the situation
            // text does not fit seven tabs without wrapping or overflow.
            const compact = views.length > 3;
            return (
              <button
                aria-pressed={active}
                className={cn(
                  // The border is the no-JS underline; `.tab-marker` takes
                  // over once measured (`[data-marker="on"]`, globals.css).
                  "relative border-b pb-1 text-caption transition-[color,border-color] duration-fast ease-exit focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  ruleTabHitClass,
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground fine-hover:text-foreground",
                )}
                key={view.tier}
                onClick={() => onSelect(view.tier)}
                type="button"
              >
                {compact ? view.label : <>{view.label}<span className="text-muted-foreground"> · {view.situation}</span></>}
                {showInstanceSpec ? (
                  <span className="ml-2 font-mono text-2xs text-muted-foreground">
                    {view.instanceSpec}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
  );
}
