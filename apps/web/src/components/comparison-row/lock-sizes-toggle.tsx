"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { AnimatedLockIcon } from "./lock-icon";

/* ─────────────────────────────────────────────────────────
 * LOCK TOGGLE STORYBOARD  (one press)
 *
 *     0ms   the fill fades between solid and outline (160ms)
 *     0ms   the shackle swings on its left hinge (180ms)
 *     0ms   the label slot glides to the other label's width (200ms) while
 *           the two labels crossfade through a 2px blur (150ms)
 *   ~200ms  everything has settled; nothing scaled, nothing moved siblings
 *
 * Every layer is a CSS transition, so a second press mid-flight reverses
 * from wherever it is instead of restarting.
 * ───────────────────────────────────────────────────────── */

type LabelKey = "locked" | "unlocked";

const LABEL: Record<LabelKey, string> = {
  locked: "Same size",
  unlocked: "Different sizes",
};

function labelClass(active: boolean) {
  return cn(
    "inline-block transition-[opacity,filter] duration-150 ease-(--ease-out)",
    active ? "blur-[0px] opacity-100" : "absolute top-0 left-0 blur-[2px] opacity-0",
  );
}

/**
 * Both labels live in one clipped slot. The active one sits in flow, so the
 * slot is the right width on first paint with no measurement; the other is
 * absolute and fading. Measured widths let the slot glide between the two
 * on a toggle instead of snapping, without a layout animation stretching
 * the text to get there.
 */
function LockLabel({ locked }: { locked: boolean }) {
  const lockedRef = useRef<HTMLSpanElement>(null);
  const unlockedRef = useRef<HTMLSpanElement>(null);
  const [widths, setWidths] = useState<Partial<Record<LabelKey, number>>>({});

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      setWidths((previous) => {
        let next = previous;
        for (const entry of entries) {
          const key = (entry.target as HTMLElement).dataset.label as LabelKey;
          const width = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
          if (next[key] !== width) next = { ...next, [key]: width };
        }
        return next;
      });
    });
    if (lockedRef.current) observer.observe(lockedRef.current);
    if (unlockedRef.current) observer.observe(unlockedRef.current);
    return () => observer.disconnect();
  }, []);

  // A zero width means the slot is hidden (below `sm`); fall back to auto so
  // it is already correct when the viewport grows into it.
  const width = widths[locked ? "locked" : "unlocked"] || undefined;

  return (
    <span
      // The button's aria-label already names it; keep the fading label out of the tree.
      aria-hidden="true"
      className="relative hidden overflow-hidden whitespace-nowrap transition-[width] duration-200 ease-(--ease-out) motion-reduce:transition-none sm:block"
      style={{ width }}
    >
      <span className={labelClass(locked)} data-label="locked" ref={lockedRef}>
        {LABEL.locked}
      </span>
      <span className={labelClass(!locked)} data-label="unlocked" ref={unlockedRef}>
        {LABEL.unlocked}
      </span>
    </span>
  );
}

export function LockSizesToggle({
  locked,
  onChange,
}: {
  locked: boolean;
  onChange: (locked: boolean) => void;
}) {
  return (
    <Button
      aria-label={
        locked
          ? "Sizes locked together. Unlock to allow different sizes per column."
          : "Sizes can differ per column. Lock to match them all to one size."
      }
      aria-pressed={locked}
      className={cn(
        "h-11 gap-2 px-2 sm:h-9 sm:px-3",
        // The shared .ui-button rule pins transition-property to transform so
        // presses stay crisp; widen it here so the fill fades with the label.
        "[transition-property:color,background-color,border-color,transform]!",
      )}
      onClick={() => onChange(!locked)}
      title={
        locked
          ? "Sizes are locked together. Adding or resizing a column updates them all."
          : "Sizes can differ per column. Lock to match them all to one size."
      }
      type="button"
      variant={locked ? "default" : "outline"}
    >
      <AnimatedLockIcon className="size-4 shrink-0" locked={locked} />
      <LockLabel locked={locked} />
    </Button>
  );
}
