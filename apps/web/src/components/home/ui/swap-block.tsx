"use client";

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { useHomeMotion } from "../home-motion";

/** How long the leaving copy stays in the tree — longer than `swap-out`
    (140 ms, globals.css) so the animation always finishes before removal. */
const LEAVE_MS = 220;

type Swap = { token: string; node: ReactNode; previous: ReactNode | null; generation: number };

/* ─────────────────────────────────────────────────────────
 * BLOCK SWAP STORYBOARD  (a slot changes which thing it describes)
 *
 *     0ms   the old block blurs out in place (140ms, 2px)
 *     0ms   the new block blurs in where it sits (180ms)
 *   ~180ms  settled — one block, no second object ever visibly overlapped
 *
 * `ui/swap-text.tsx` handles a changed reading; this handles a changed
 * identity, where the name and the mark beside it have to cross as one object
 * rather than as a text fade next to a colour tween. Same CSS, same timings.
 * No width glide: the leaving copy is absolute, so nothing to its right waits
 * for it.
 * ───────────────────────────────────────────────────────── */

/**
 * Children that cross-fade in place whenever `token` changes. `className`
 * lays out the content and is applied to both copies, so the leaving one is
 * shaped exactly like the arriving one; the shell it sits in keeps `.swap`'s
 * own `inline-block` positioning, which a layout class here must not fight. `token` names
 * the content — a product slug, not a formatted string — so a slot that
 * re-renders with the same occupant never plays. Nothing plays on mount.
 *
 * `children` must be determined by `token`, the same way `SwapText`'s single
 * `value` is both its identity and its content: the rendered copy is the one
 * captured with the current token, so children that change on their own
 * would not be picked up. For content that changes under a stable identity,
 * put a `SwapText` inside instead.
 */
export function SwapBlock({
  children,
  className,
  token,
}: {
  children: ReactNode;
  className?: string;
  token: string;
}) {
  const { enabled } = useHomeMotion();
  const [swap, setSwap] = useState<Swap>({ token, node: children, previous: null, generation: 0 });

  // Derive from the previous render (the documented setState-in-render
  // pattern): React discards this pass and re-renders with the new token.
  // `swap.node` is still the outgoing copy at this point.
  if (swap.token !== token) {
    setSwap({
      token,
      node: children,
      previous: enabled ? swap.node : null,
      generation: swap.generation + 1,
    });
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

  return (
    <span className="swap">
      <span
        className={cn(className, swap.previous != null && "swap-in")}
        key={swap.generation}
      >
        {swap.node}
      </span>
      {swap.previous != null ? (
        <span
          aria-hidden="true"
          className={cn(className, "swap-out")}
          key={`out-${swap.generation}`}
          style={{ left: 0 }}
        >
          {swap.previous}
        </span>
      ) : null}
    </span>
  );
}
