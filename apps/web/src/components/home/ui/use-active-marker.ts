"use client";

import { useEffect, useLayoutEffect, type RefObject } from "react";

/* ─────────────────────────────────────────────────────────
 * MARKER STORYBOARD  (the reader picks another tab or column)
 *
 *     0ms   the rule under the old tab starts sliding, and re-sizing, to
 *           the new tab (240ms, --ease-out, one `transform`); the new tab's
 *           text is already the active colour
 *   240ms   the rule has landed exactly where the tab's own border would be
 *
 * One absolutely positioned element per group, translated to the active
 * item and scaled to its width. The per-item border stays in the markup as the
 * no-JS and first-paint underline; once the marker has measured, the CSS
 * hides that border (`[data-marker="on"]`) so the two never stack.
 * ───────────────────────────────────────────────────────── */

/**
 * Keeps `marker` over the element matching `selector` inside `root`, which
 * must be the offset parent of the items (`position: relative`). `axis`
 * "xy" pins the marker to the item's bottom edge (a tab rule); "x" only
 * follows horizontally (a column highlight that spans its container).
 * `dependency` is whatever changes the active item.
 */
export function useActiveMarker(
  root: RefObject<HTMLElement | null>,
  marker: RefObject<HTMLElement | null>,
  { axis = "xy", dependency, selector = '[aria-pressed="true"]' }: {
    axis?: "x" | "xy";
    dependency: unknown;
    selector?: string;
  },
) {
  useLayoutEffect(() => {
    const container = root.current;
    const mark = marker.current;
    if (!container || !mark) return;
    place(container, mark, selector, axis, mark.dataset.ready !== "true");
  }, [axis, dependency, marker, root, selector]);

  // Re-place, without motion, when the group reflows (tabs wrap, a column
  // hides below `md`). The observer fires once on attach; that first call
  // must not cut off a glide the effect above has just started.
  useEffect(() => {
    const container = root.current;
    const mark = marker.current;
    if (!container || !mark) return;
    let attached = false;
    const observer = new ResizeObserver(() => {
      if (!attached) {
        attached = true;
        return;
      }
      place(container, mark, selector, axis, true);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [axis, marker, root, selector]);
}

function place(
  container: HTMLElement,
  mark: HTMLElement,
  selector: string,
  axis: "x" | "xy",
  instant: boolean,
) {
  const active = container.querySelector<HTMLElement>(selector);
  if (!active) {
    delete mark.dataset.ready;
    delete container.dataset.marker;
    return;
  }
  const x = active.offsetLeft;
  const y = active.offsetTop + active.offsetHeight - mark.offsetHeight;
  // The marker is 1px wide in CSS with a left-top origin, so its width is a
  // scale factor: one composited `transform` carries both the slide and the
  // resize, and neither touches layout.
  const width = `scaleX(${active.offsetWidth})`;
  if (instant) mark.style.transition = "none";
  mark.style.transform = axis === "x"
    ? `translateX(${x}px) ${width}`
    : `translate(${x}px, ${y}px) ${width}`;
  if (instant) {
    void mark.offsetWidth; // commit before re-enabling the transition
    mark.style.transition = "";
  }
  mark.dataset.ready = "true";
  container.dataset.marker = "on";
}
