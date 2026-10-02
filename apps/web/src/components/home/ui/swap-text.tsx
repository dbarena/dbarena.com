"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { useHomeMotion } from "../home-motion";

/** How long the leaving copy stays in the tree — longer than `swap-out`
    (140 ms, globals.css) so the animation always finishes before removal. */
const LEAVE_MS = 220;

type Swap = { value: string; previous: string | null; generation: number };

/* ─────────────────────────────────────────────────────────
 * SWAP STORYBOARD  (a value re-reads after a size or I/O change)
 *
 *     0ms   the old reading blurs out in place (140ms, 2px)
 *     0ms   the new reading blurs in where it sits (180ms)
 *     0ms   with `glide`, the slot's width eases to the new text (200ms)
 *   ~200ms  settled — one number, no second object ever visibly overlapped
 *
 * The same recipe as the Compare toolbar's lock label: two copies in one
 * slot, the live one in flow so first paint needs no measurement, the
 * leaving one absolute. Nothing plays on mount, and nothing plays when the
 * text is unchanged — a size switch only moves the readings that moved.
 * ───────────────────────────────────────────────────────── */

/**
 * Text that changes in place — a value, a rank, a price, a label.
 * `align` anchors the leaving copy to the edge the text is set from, so a
 * shorter reading never slides under a longer one. `glide` also eases the
 * slot's width, for text whose neighbours would otherwise jump (a button
 * label with an icon after it).
 */
export function SwapText({
  align = "end",
  className,
  glide = false,
  value,
}: {
  align?: "start" | "end";
  className?: string;
  glide?: boolean;
  value: string;
}) {
  const { enabled } = useHomeMotion();
  const [swap, setSwap] = useState<Swap>({ value, previous: null, generation: 0 });
  // Derive from the previous render (the documented setState-in-render
  // pattern): React discards this pass and re-renders with the new value.
  if (swap.value !== value) {
    setSwap({ value, previous: enabled ? swap.value : null, generation: swap.generation + 1 });
  }

  useEffect(() => {
    if (swap.previous == null) return;
    const timer = setTimeout(() => {
      setSwap((current) =>
        current.generation === swap.generation ? { ...current, previous: null } : current,
      );
    }, LEAVE_MS);
    return () => clearTimeout(timer);
  }, [swap.generation, swap.previous]);

  const slot = useWidthGlide(glide && enabled, swap.value);

  return (
    <span className={cn("swap", glide && "swap-glide", className)} ref={slot}>
      <span className={swap.previous != null ? "swap-in" : undefined} key={swap.generation}>
        {swap.value}
      </span>
      {swap.previous != null ? (
        <span
          aria-hidden="true"
          className="swap-out"
          key={`out-${swap.generation}`}
          style={align === "end" ? { right: 0 } : { left: 0 }}
        >
          {swap.previous}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Eases the slot from the width it is showing to the width its new text
 * needs, then hands the width back to the content. Reads the mid-flight
 * width when interrupted, so a second change retargets instead of jumping.
 * Every step is an inline style on the slot alone — no CSS variable on a
 * parent, no children to recalculate.
 */
function useWidthGlide(enabled: boolean, value: string) {
  const slot = useRef<HTMLSpanElement>(null);
  const settled = useRef<number | null>(null);

  useLayoutEffect(() => {
    const element = slot.current;
    if (!element || !enabled) return;

    const from = element.style.width ? element.getBoundingClientRect().width : settled.current;
    element.style.transition = "none";
    element.style.width = "";
    const to = element.getBoundingClientRect().width;
    settled.current = to;
    if (from == null || Math.abs(from - to) < 0.5) {
      element.style.transition = "";
      return;
    }

    element.style.width = `${from}px`;
    void element.offsetWidth; // commit the start width before retargeting
    element.style.transition = "";
    element.style.width = `${to}px`;

    const release = (event: TransitionEvent) => {
      if (event.target !== element || event.propertyName !== "width") return;
      element.style.width = "";
    };
    element.addEventListener("transitionend", release);
    return () => element.removeEventListener("transitionend", release);
  }, [enabled, value]);

  return slot;
}
