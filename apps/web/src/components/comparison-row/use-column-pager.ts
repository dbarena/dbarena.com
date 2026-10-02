"use client";

import { type RefObject, useCallback, useSyncExternalStore } from "react";
import { interactionScrollBehavior } from "@/components/interaction-mode";

const PREV = 1;
const NEXT = 2;
const OVERFLOW = 4;
const THRESHOLD = 12;
const DESKTOP = "(min-width: 48rem)";

type Scroller = {
  left: number;
  max: number;
  scrollTo: (left: number, behavior: ScrollBehavior) => void;
};

function rowContentWidth(rail: HTMLElement) {
  const row = rail.querySelector("[data-comparison-id]")?.parentElement;
  if (!row) return 0;
  let width = 0;
  for (const child of row.children) {
    const el = child as HTMLElement;
    if (getComputedStyle(el).position === "absolute") continue;
    width += el.offsetWidth;
  }
  return width;
}

function scrollerFor(rail: HTMLElement): Scroller {
  // Phones scroll the rail; wider screens scroll the document itself.
  const useRail = !window.matchMedia(DESKTOP).matches;
  if (useRail) {
    return {
      left: rail.scrollLeft,
      max: Math.max(0, rowContentWidth(rail) - rail.clientWidth),
      scrollTo: (left, behavior) => rail.scrollTo({ left, behavior }),
    };
  }
  return {
    left: window.scrollX,
    max: Math.max(
      0,
      rowContentWidth(rail) - document.documentElement.clientWidth,
    ),
    scrollTo: (left, behavior) => window.scrollTo({ left, behavior }),
  };
}

function bitsFor(rail: HTMLElement | null) {
  if (!rail) return 0;
  const { left, max } = scrollerFor(rail);
  if (max <= THRESHOLD) return 0;
  return (
    OVERFLOW |
    (left > THRESHOLD ? PREV : 0) |
    (left < max - THRESHOLD ? NEXT : 0)
  );
}

export function useColumnPager(
  railRef: RefObject<HTMLDivElement | null>,
  columnCount: number,
) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const rail = railRef.current;
      window.addEventListener("scroll", notify, { passive: true });
      window.addEventListener("resize", notify);
      rail?.addEventListener("scroll", notify, { passive: true });
      const observer = new ResizeObserver(notify);
      if (rail) {
        observer.observe(rail);
        const stack = rail.firstElementChild;
        if (stack) observer.observe(stack);
        rail
          .querySelectorAll("[data-comparison-id]")
          .forEach((column) => observer.observe(column));
      }
      const mutations = new MutationObserver(notify);
      if (rail) {
        mutations.observe(rail, { childList: true, subtree: true });
      }
      const frame = requestAnimationFrame(notify);
      return () => {
        window.removeEventListener("scroll", notify);
        window.removeEventListener("resize", notify);
        rail?.removeEventListener("scroll", notify);
        observer.disconnect();
        mutations.disconnect();
        cancelAnimationFrame(frame);
      };
    },
    // Re-subscribe when the rail mounts or its columns change so observers
    // attach to the live nodes after add/remove rather than a stale tree.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [railRef, columnCount],
  );

  const snapshot = useCallback(() => bitsFor(railRef.current), [railRef]);

  const bits = useSyncExternalStore(subscribe, snapshot, () => 0);

  const page = useCallback(
    (direction: -1 | 1) => {
      const rail = railRef.current;
      if (!rail) return;
      const column = rail.querySelector<HTMLElement>("[data-comparison-id]");
      const step = column?.getBoundingClientRect().width ?? 240;
      const scroller = scrollerFor(rail);
      const behavior = interactionScrollBehavior();
      scroller.scrollTo(
        Math.max(0, Math.min(scroller.max, scroller.left + direction * step)),
        behavior,
      );
    },
    [railRef],
  );

  return {
    overflows: (bits & OVERFLOW) !== 0,
    canPrev: (bits & PREV) !== 0,
    canNext: (bits & NEXT) !== 0,
    page,
  };
}
