"use client";

import { useEffect, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function isKeyboardInput() {
  return document.documentElement.dataset.inputMode === "keyboard";
}

export function useKeyboardInput() {
  return useSyncExternalStore(subscribe, isKeyboardInput, () => false);
}

export function interactionScrollBehavior(): ScrollBehavior {
  return isKeyboardInput() || window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "instant"
    : "smooth";
}

/** How far the pointer has to travel before a deliberate move counts as a
    switch back to pointer input — enough to ignore a hand resting on a
    trackpad, or the one event the browser sends as the page scrolls under a
    still cursor. */
const POINTER_SLOP_PX = 4;

/** Keyboard navigation is immediate; pointer interactions can use quiet feedback. */
export function InteractionMode() {
  useEffect(() => {
    const root = document.documentElement;
    const setMode = (mode: "keyboard" | "pointer") => {
      if (root.dataset.inputMode === mode) return;
      root.dataset.inputMode = mode;
      listeners.forEach((notify) => notify());
    };
    // Where the pointer was first seen since keyboard mode was entered; moving
    // away from it is what hands control back.
    let anchor: { x: number; y: number } | null = null;
    const keyboard = (event: KeyboardEvent) => {
      if (!["Shift", "Control", "Alt", "Meta"].includes(event.key)) {
        anchor = null;
        setMode("keyboard");
      }
    };
    const pointer = () => setMode("pointer");
    // A keystroke should not leave the whole page in its no-motion mode for as
    // long as the reader keeps using the mouse without clicking anything.
    const move = (event: PointerEvent) => {
      if (!isKeyboardInput()) return;
      if (!anchor) {
        anchor = { x: event.clientX, y: event.clientY };
        return;
      }
      const dx = event.clientX - anchor.x;
      const dy = event.clientY - anchor.y;
      if (dx * dx + dy * dy < POINTER_SLOP_PX * POINTER_SLOP_PX) return;
      setMode("pointer");
    };
    document.addEventListener("keydown", keyboard, true);
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("pointermove", move, { capture: true, passive: true });
    return () => {
      document.removeEventListener("keydown", keyboard, true);
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("pointermove", move, true);
      delete root.dataset.inputMode;
    };
  }, []);
  return null;
}
