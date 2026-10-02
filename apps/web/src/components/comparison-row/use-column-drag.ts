"use client";

import {
  animate,
  frame,
  motionValue,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import {
  COLUMN_SLOT_TRANSITION,
  EASE_OUT,
} from "@/components/comparison-row/comparison-motion";
import {
  DRAG_THRESHOLD,
  OVERSHOOT_RATIO,
  REVERSE_RATIO,
  SWAP_RATIO,
  rubberBand,
  sameOrder,
  swap,
  type ColumnSlab,
} from "@/components/comparison-row/column-drag-math";

const LIFT_IN = { duration: 0.18, ease: EASE_OUT };
const LIFT_OUT = { duration: 0.16, ease: EASE_OUT };
// Near-critically damped: a benchmark table is not the place for bounce, but
// the spring still carries the pointer's velocity so a flick lands naturally.
const SETTLE = { type: "spring", visualDuration: 0.34, bounce: 0.05 } as const;
const INSTANT = { duration: 0 };

export type { ColumnSlab };

// Header and metric cells share one motion value per column id so the whole
// column - not just the header - tracks the pointer as a single rigid block.
// `slabX` and `wellX` drive the two chrome overlays that span the full table:
// the travelling slab (shadow + outline) and the well left behind in the slot.
export function useColumnDrag(onReorder: (nextIds: string[]) => void) {
  const [values] = useState(() => new Map<string, MotionValue<number>>());
  const slabX = useMotionValue(0);
  const wellX = useMotionValue(0);
  const lift = useMotionValue(0);
  const activePointerId = useRef<number | null>(null);
  const release = useRef<(() => void) | null>(null);
  const dragToken = useRef(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [slab, setSlab] = useState<ColumnSlab | null>(null);
  const [status, setStatus] = useState("");
  const reduceMotion = useReducedMotion();

  // A drag can outlive the pointer that started it (route change, HMR).
  useEffect(() => () => release.current?.(), []);

  function dragX(id: string) {
    let value = values.get(id);
    if (!value) {
      value = motionValue(0);
      values.set(id, value);
    }
    return value;
  }

  function startDrag(
    columnId: string,
    order: readonly string[],
    event: React.PointerEvent,
    columnEl: HTMLElement | null,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (activePointerId.current !== null || !columnEl) return;

    // `offsetLeft/Width` are measured against the relatively-positioned table
    // stack, which is the same coordinate space the chrome overlays live in.
    const width = columnEl.offsetWidth;
    if (!width) return;
    const home = { left: columnEl.offsetLeft, width };

    const handle = event.currentTarget as HTMLElement;
    event.preventDefault();
    // preventDefault blocks the implicit focus; reordering by keyboard should
    // be available the moment a pointer drag ends.
    handle.focus({ preventScroll: true });
    handle.setPointerCapture?.(event.pointerId);

    const startClientX = event.clientX;
    const value = dragX(columnId);
    const token = (dragToken.current += 1);
    const overshoot = width * OVERSHOOT_RATIO;
    const slot = reduceMotion ? INSTANT : COLUMN_SLOT_TRANSITION;

    // `domOrder` is what React rendered and stays fixed for the whole gesture;
    // `liveOrder` is where the columns visually are. The difference, in slots,
    // is each column's transform.
    const domOrder = [...order];
    let liveOrder = domOrder;
    let lifted = false;
    let lastSwap: 1 | -1 | 0 = 0;

    activePointerId.current = event.pointerId;

    function slotOffset(id: string) {
      return (liveOrder.indexOf(id) - domOrder.indexOf(id)) * width;
    }

    function beginLift() {
      lifted = true;
      slabX.set(0);
      wellX.set(0);
      setSlab(home);
      setDraggingId(columnId);
      animate(lift, 1, reduceMotion ? INSTANT : LIFT_IN);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    }

    /**
     * Inner columns are capped by the swap itself. The outermost one has no
     * slot to move into, so it resists from the first pixel - it gives a
     * little, then stops, instead of sliding out over the page gutter.
     */
    function resist(delta: number) {
      const index = liveOrder.indexOf(columnId);
      if (delta > 0 && index === liveOrder.length - 1) {
        return rubberBand(delta, overshoot);
      }
      if (delta < 0 && index === 0) {
        return -rubberBand(-delta, overshoot);
      }
      return delta;
    }

    function handleMove(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== activePointerId.current) return;
      const travel = moveEvent.clientX - startClientX;
      if (!lifted) {
        if (Math.abs(travel) < DRAG_THRESHOLD) return;
        beginLift();
      }

      // How far the pointer is past the slot the column currently claims.
      let delta = travel - slotOffset(columnId);
      for (let guard = 0; guard < domOrder.length; guard += 1) {
        const direction = delta > 0 ? 1 : -1;
        const ratio = direction === -lastSwap ? REVERSE_RATIO : SWAP_RATIO;
        if (Math.abs(delta) <= width * ratio) break;
        const index = liveOrder.indexOf(columnId);
        const neighbor = index + direction;
        if (neighbor < 0 || neighbor >= liveOrder.length) break;

        const displacedId = liveOrder[neighbor]!;
        liveOrder = swap(liveOrder, index, neighbor);
        delta -= width * direction;
        lastSwap = direction;

        // The neighbour crosses into the slot the dragged column just gave up.
        // The spring retargets from its current velocity if the reader swaps
        // straight back, and the well rides the same spring so the whole row
        // resettles as one movement instead of two.
        animate(dragX(displacedId), slotOffset(displacedId), slot);
        animate(wellX, slotOffset(columnId), slot);
      }

      const position = slotOffset(columnId) + resist(delta);
      value.set(position);
      slabX.set(position);
    }

    function detach() {
      activePointerId.current = null;
      release.current = null;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      window.removeEventListener("keydown", handleKey);
      handle.releasePointerCapture?.(event.pointerId);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    /**
     * Drop. Committed inside Motion's `update` step so the DOM reorder and the
     * rebased transforms land in the same frame: a render scheduled from
     * `update` runs in that frame's `render` step, never the next one.
     */
    function settle() {
      const order = liveOrder;
      const changed = !sameOrder(order, domOrder);
      // Read before the frame: a motion value's velocity window is 30ms, and
      // the frame may land after it closes.
      const velocity = value.getVelocity();
      const settleTransition = reduceMotion ? INSTANT : { ...SETTLE, velocity };

      frame.update(() => {
        if (changed) {
          // The DOM is about to take the live order. Every column that ends up
          // in a new slot has its offset re-expressed against that slot, with
          // its velocity carried over, so nothing on screen moves - the springs
          // continue as if the commit never happened.
          for (const id of domOrder) {
            const shift = slotOffset(id);
            if (shift === 0) continue;
            const x = dragX(id);
            const carried = x.getVelocity();
            x.jump(x.get() - shift);
            animate(
              x,
              0,
              id === columnId
                ? settleTransition
                : reduceMotion
                  ? INSTANT
                  : { ...COLUMN_SLOT_TRANSITION, velocity: carried },
            );
          }
          flushSync(() => onReorder([...order]));
        } else {
          animate(value, 0, settleTransition);
        }

        animate(lift, 0, reduceMotion ? INSTANT : LIFT_OUT);
        // The overlays are absolutely positioned outside the flex flow, so the
        // commit does not move them; the slab simply finishes its journey.
        animate(slabX, slotOffset(columnId), settleTransition).then(() => {
          // A new drag may have claimed the overlays while this one settled.
          if (dragToken.current !== token) return;
          setDraggingId(null);
          setSlab(null);
        });
      });
    }

    function finish() {
      detach();
      if (lifted) settle();
    }

    function handleUp(upEvent: PointerEvent) {
      if (upEvent.pointerId !== activePointerId.current) return;
      finish();
    }

    /** Escape abandons the gesture: every column springs home, nothing commits. */
    function handleKey(keyEvent: KeyboardEvent) {
      if (keyEvent.key !== "Escape") return;
      keyEvent.preventDefault();
      if (lifted) {
        for (const id of liveOrder) {
          if (id !== columnId && slotOffset(id) !== 0) animate(dragX(id), 0, slot);
        }
        liveOrder = domOrder;
        animate(wellX, 0, slot);
      }
      finish();
    }

    release.current = finish;

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    window.addEventListener("keydown", handleKey);
  }

  /** Arrow-key reordering. Keyboard moves land instantly - see comparison-motion. */
  function moveByKeyboard(
    columnId: string,
    order: readonly string[],
    direction: 1 | -1,
    label: string,
  ) {
    const index = order.indexOf(columnId);
    const neighbor = index + direction;
    if (index < 0 || neighbor < 0 || neighbor >= order.length) return false;
    onReorder(swap(order, index, neighbor));
    setStatus(`${label} moved to column ${neighbor + 1} of ${order.length}`);
    return true;
  }

  return {
    dragX,
    draggingId,
    lift,
    moveByKeyboard,
    slab,
    slabX,
    status,
    startDrag,
    wellX,
  };
}

export type ColumnDrag = ReturnType<typeof useColumnDrag>;
