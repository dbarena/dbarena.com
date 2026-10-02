"use client";

import { ArrowDown } from "lucide-react";
import { useRef, type PointerEvent } from "react";

import { SizePathMark } from "./marks/size-path-marks";

/** How far each plate leans, in px at the pointer's furthest reach — the
    stack seen from a slightly different angle, so the top plate travels most
    and the sheet of guides not at all. */
const LEAN_PX: Record<string, readonly [number, number]> = {
  base: [1.5, 1],
  middle: [3, 2.2],
  top: [5, 3.6],
};

/**
 * Jump card for one cache-fit chapter.
 *
 * The machine is alive but never busy. At rest its plates levitate a couple
 * of pixels on a slow loop and the accent LEDs run in sequence, so the three
 * cards read as powered-on hardware. Under the pointer the plates lean toward
 * it by depth — the top plate a few pixels, the base barely — and settle back
 * when it leaves. The pointer writes each plate's `transform` directly, on the
 * three elements the move can possibly affect: a CSS variable on the card
 * would make every pointermove a style recalc of the whole subtree. The lag
 * that makes the follow feel weighted is still a CSS transition retargeting,
 * not a per-frame script. The hover recolouring (corner frame, datum lines,
 * signal wires, arrow) is unchanged. Everything else lives in
 * `home-illustrations.css`; the follow is gated on `(hover: hover) and
 * (pointer: fine)` here and there, and `prefers-reduced-motion` pins the
 * plates with `transform: none !important`.
 */
export function SizePathCard({ blurb, href, kind, range, title }: {
  blurb: string;
  href: string;
  kind: "side-project" | "production" | "heavy";
  range: string;
  title: string;
}) {
  const card = useRef<HTMLAnchorElement>(null);
  const plates = useRef<HTMLElement[] | null>(null);

  /** The three layers, looked up on the first move and kept: they are static
      markup, and the media query cannot change without a new pointing
      device. Empty on a touch screen, which switches the follow off. */
  function leaning() {
    if (plates.current) return plates.current;
    plates.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches
      ? Array.from(card.current?.querySelectorAll<HTMLElement>(".machine-layer[data-depth]") ?? [])
      : [];
    return plates.current;
  }

  function follow(event: PointerEvent<HTMLAnchorElement>) {
    const layers = leaning();
    if (layers.length === 0) return;
    const rect = card.current?.getBoundingClientRect();
    if (!rect) return;
    // -1..1 from the card's centre, scaled per depth.
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    for (const layer of layers) {
      const lean = LEAN_PX[layer.dataset.depth ?? ""];
      if (!lean) continue;
      layer.style.transform = `translate(${(x * lean[0]).toFixed(2)}px, ${(y * lean[1]).toFixed(2)}px)`;
    }
  }

  function release() {
    for (const layer of plates.current ?? []) layer.style.transform = "";
  }

  return (
    <a
      className="ranking-card group min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      href={href}
      onPointerLeave={release}
      onPointerMove={follow}
      ref={card}
    >
      <p className="ranking-card-range font-mono text-note leading-[1.6] text-muted-foreground">{range}</p>
      <div className="ranking-card-art">
        <SizePathMark kind={kind} />
      </div>
      <div className="ranking-card-copy">
        <h3 className="text-body font-semibold tracking-[-0.01em]">{title}</h3>
        <p className="mt-2 text-pretty text-caption leading-[1.55] text-[color:var(--reading-color)]">{blurb}</p>
      </div>
      <p className="ranking-card-action text-caption text-muted-foreground">
        See the ranking <span aria-hidden="true" className="schematic-arrow"><ArrowDown className="size-3.5" /></span>
      </p>
    </a>
  );
}
