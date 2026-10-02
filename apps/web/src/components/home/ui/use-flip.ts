"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

import { useHomeMotion } from "../home-motion";

type Spot = { left: number; top: number };

/* ─────────────────────────────────────────────────────────
 * ROW GLIDE STORYBOARD  (a ranking re-sorts after a size or I/O change)
 *
 *     0ms   React commits the new order; before paint, every row that
 *           landed somewhere else is pulled back to where it was
 *     0ms   the pull is released — each row glides to its new slot (240ms)
 *   240ms   settled; the transform is gone and the DOM is plain again
 *
 * FLIP on `transform` only, driven by the `[data-flip]` transition in
 * globals.css. A click mid-flight reads each row's in-flight offset and
 * retargets from there. This is the hand-rolled half of motion's layout
 * animation — the half this page needs, without the projection engine, which
 * costs more gzipped than the rest of this page's JS combined.
 * ───────────────────────────────────────────────────────── */

/**
 * Glides the `[data-flip="<key>"]` descendants of `root` to their new
 * positions whenever `dependency` changes. Keys must be stable per row
 * (the product slug); a key that is new this render simply appears.
 */
export function useFlip(root: RefObject<HTMLElement | null>, dependency: unknown) {
  const { enabled } = useHomeMotion();
  const spots = useRef(new Map<string, Spot>());

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const moves: Array<{ item: HTMLElement; dx: number; dy: number }> = [];
    const next = new Map<string, Spot>();

    for (const item of element.querySelectorAll<HTMLElement>("[data-flip]")) {
      const key = item.dataset.flip!;
      // offsetTop/offsetLeft ignore transforms: the layout slot, not the
      // painted position.
      const spot = { left: item.offsetLeft, top: item.offsetTop };
      next.set(key, spot);
      const before = spots.current.get(key);
      if (!before || !enabled) continue;
      const drift = inFlight(item);
      const dx = before.left + drift.x - spot.left;
      const dy = before.top + drift.y - spot.top;
      if (Math.abs(dx) >= 0.5 || Math.abs(dy) >= 0.5) moves.push({ item, dx, dy });
    }
    spots.current = next;
    if (moves.length === 0) return;

    for (const { item, dx, dy } of moves) {
      item.style.transition = "none";
      item.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    void element.offsetHeight; // commit the start positions
    for (const { item } of moves) {
      item.style.transition = "";
      item.style.transform = "";
    }
  }, [dependency, enabled, root]);

  // A resize with no re-render would leave the snapshot stale, and the next
  // glide would start from the wrong place. Re-measure, never animate.
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const next = new Map<string, Spot>();
      for (const item of element.querySelectorAll<HTMLElement>("[data-flip]")) {
        next.set(item.dataset.flip!, { left: item.offsetLeft, top: item.offsetTop });
      }
      spots.current = next;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [root]);
}

function inFlight(item: HTMLElement) {
  const transform = getComputedStyle(item).transform;
  if (!transform || transform === "none") return { x: 0, y: 0 };
  const matrix = new DOMMatrixReadOnly(transform);
  return { x: matrix.m41, y: matrix.m42 };
}
