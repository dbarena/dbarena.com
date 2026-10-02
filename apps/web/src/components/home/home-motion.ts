"use client";

import { useReducedMotion } from "motion/react";
import { useKeyboardInput } from "@/components/interaction-mode";

export { EASE_OUT } from "@/lib/ease";

/** Motion moment 1, the hero rank-line draw, and the only thing on this page
    that plays on mount: each product's `<path>` draws over `DRAW_MS` via
    `stroke-dashoffset`, staggered `DRAW_STAGGER_MS` apart so the leader's line
    settles first. The animation itself is the `.rank-draw` CSS keyframe in
    globals.css — these numbers are still its source of truth, passed in as
    `--draw-ms` and `--draw-delay` by `hero/rank-chart.tsx`, which is also
    where the "never on scroll, never on a re-render" reasoning lives.

    Nothing that belongs to a line may be on screen before that line is: a dot
    lights up as the pen reaches it, the product's name lands as the pen
    stops, and the guide line — an annotation of the selection, not part of
    the reading — fades in once every line has settled. Otherwise the chart
    looks finished while its lines are still crawling in behind it. Those
    three durations live with their keyframes in globals.css (`.rank-dot`,
    `.rank-label`, `.rank-guide-in`); only the two numbers their delays are
    derived from have to be shared with React. */
export const DRAW_MS = 450;
export const DRAW_STAGGER_MS = 60;

/** Everything else is CSS — there is no animation library on this page, and
    nothing here springs: a reading that was measured should not overshoot
    itself. The change beat — what happens when the reader picks another size,
    I/O setup or metric — is rows gliding (`ui/use-flip.ts`), changed readings
    crossing through a 2px blur (`ui/swap-text.tsx`), the tab rule and the
    matrix highlight sliding (`ui/use-active-marker.ts`), a share bar settling
    (`.share-bar`) and the hero guide line tracking the picker
    (`.rank-guide`). Tokens and storyboard live in globals.css under "The
    change beat". It never plays on mount, and it never fires for a reading
    that did not change. */

/**
 * Decorative motion is opt-out twice over: the OS reduced-motion setting and
 * the site's keyboard input mode both switch it off. Data never depends on it.
 */
export function useHomeMotion() {
  const reduced = useReducedMotion();
  const keyboard = useKeyboardInput();
  return { enabled: !reduced && !keyboard };
}
