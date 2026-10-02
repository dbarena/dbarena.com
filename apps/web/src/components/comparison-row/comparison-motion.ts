"use client";

import { useIsPresent, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useKeyboardInput } from "@/components/interaction-mode";
import { EASE_OUT } from "@/lib/ease";

export { EASE_OUT };

const COLUMN_DURATION = 0.2;
const COLUMN_EXIT_DURATION = 0.1;

/* ─────────────────────────────────────────────────────────
 * COLUMN ENTER STORYBOARD  (a column is added)
 *
 *     0ms   survivors start narrowing into their new widths (200ms)
 *     0ms   the header rises 6px out of a 4px blur and fades up (300ms)
 *   +22ms   each metric row follows, one after the next
 *   ~200ms  the last row lands - the cascade reads top-to-bottom, so the
 *           column looks like it fills in rather than blinking on
 * ───────────────────────────────────────────────────────── */
const ENTER_DURATION = 0.3;
const ENTER_STAGGER = 0.022;
const ENTER_LIFT = 6;
const ENTER_BLUR = 4;

/**
 * A column crossing to another slot is on-screen movement, not an entrance, so
 * it accelerates and decelerates rather than lurching out on a strong ease-out.
 * A critically damped spring gives that shape and - unlike a duration - it
 * retargets from its current velocity when the reader swaps straight back,
 * instead of restarting from zero and stuttering.
 *
 * Drag overlays and displaced neighbours share it so a swap reads as one
 * movement instead of two.
 */
export const COLUMN_SLOT_TRANSITION = {
  type: "spring" as const,
  visualDuration: 0.25,
  bounce: 0.08,
};

// Neighbors must reflow in the same beat as the fade. `sync` keeps the
// leaving column in flow until it finishes, so the rest wait, then snap.
export const COLUMN_PRESENCE_MODE = "popLayout" as const;

export const COLUMN_MOTION = {
  // The cell box only fades; the enter choreography lives on its content so
  // borders and row heights never move. See `useColumnEnter`.
  initial: false as const,
  animate: { opacity: 1 },
  // Clear the outgoing content before its neighbors finish moving across it.
  exit: {
    opacity: 0,
    transition: { duration: COLUMN_EXIT_DURATION, ease: EASE_OUT },
  },
  transition: {
    duration: COLUMN_DURATION,
    ease: EASE_OUT,
    layout: COLUMN_SLOT_TRANSITION,
  },
};

export const COLUMN_MOTION_REDUCED = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.16, ease: EASE_OUT },
};

/**
 * Order-insensitive on purpose. Layout projection is for add/remove reflow;
 * a reorder is either a pointer drag, which moves every column itself and
 * commits the new order with the transforms already rebased, or a keyboard
 * move, which lands instantly. Keeping the key stable across a reorder means
 * projection never snapshots for one, so it cannot fight the drag transforms.
 */
export function columnLayoutKey(columnIds: readonly string[]) {
  return [...columnIds].sort().join("|");
}

/**
 * True from the first commit after mount. The enter cascade is for columns the
 * reader adds, never for the columns that were already there on load.
 */
export function useMountedGrid() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return mounted;
}

type EnterTarget = { opacity: number; y?: number; filter?: string };

type EnterLayer = {
  initial: false | EnterTarget;
  animate?: EnterTarget;
  transition?: { duration: number; ease: typeof EASE_OUT; delay?: number };
};

const OFF: EnterLayer = { initial: false };

/**
 * Enter choreography for a new column, split by layer. `content` carries the
 * lift and blur; `surface` is the leader wash, which only fades - a wash that
 * lands before its number reads as an empty coloured block. `rowIndex`
 * staggers the cascade down the column; 0 is the header.
 */
export function useColumnEnter(
  rowIndex: number,
  enabled: boolean,
): { content: EnterLayer; surface: EnterLayer } {
  const reduceMotion = useReducedMotion();
  const keyboard = useKeyboardInput();

  if (!enabled || keyboard) return { content: OFF, surface: OFF };

  const transition = reduceMotion
    ? { duration: 0.16, ease: EASE_OUT }
    : {
        duration: ENTER_DURATION,
        ease: EASE_OUT,
        delay: rowIndex * ENTER_STAGGER,
      };
  const surface: EnterLayer = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition,
  };

  if (reduceMotion) return { content: surface, surface };
  return {
    content: {
      initial: { opacity: 0, y: ENTER_LIFT, filter: `blur(${ENTER_BLUR}px)` },
      animate: { opacity: 1, y: 0, filter: "blur(0px)" },
      transition,
    },
    surface,
  };
}

export function useColumnPresence(layoutKey: string) {
  const reduceMotion = useReducedMotion();
  const keyboard = useKeyboardInput();
  const isPresent = useIsPresent();

  if (keyboard) {
    return {
      initial: false as const,
      animate: { opacity: 1 },
      exit: { opacity: 1 },
      transition: { duration: 0, layout: { duration: 0 } },
      layout: false as const,
      layoutDependency: layoutKey,
    };
  }
  if (reduceMotion) {
    return {
      ...COLUMN_MOTION_REDUCED,
      layout: false as const,
      layoutDependency: layoutKey,
    };
  }
  return {
    ...COLUMN_MOTION,
    // Translate survivors without scaling their text, controls, or row heights.
    // Exiting cells keep their measured box while fading out of flow.
    layout: isPresent ? ("position" as const) : false,
    layoutDependency: layoutKey,
  };
}
