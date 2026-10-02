export const DRAG_THRESHOLD = 3;
// Claiming the next slot takes half a column. Giving it back takes more, so
// wobble at the boundary cannot ping-pong the order - only a deliberate move
// reverses a swap.
export const SWAP_RATIO = 0.5;
export const REVERSE_RATIO = 0.65;
export const OVERSHOOT_RATIO = 0.12;

export type ColumnSlab = { left: number; width: number };

/* Pointer drag: press does nothing until 3px, then the slab lifts and tracks
   1:1. Past half a column the neighbour swaps; reverse takes 65% so wobble
   cannot ping-pong. The DOM stays put until release, when offsets rebase in
   the same Motion frame as the commit. Escape springs every column home. */

/** Asymptotic resistance: overflow approaches `limit` but never passes it. */
export function rubberBand(overflow: number, limit: number) {
  return (overflow * limit) / (overflow + limit);
}

export function swap(order: readonly string[], from: number, to: number) {
  const next = [...order];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

export function sameOrder(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}
