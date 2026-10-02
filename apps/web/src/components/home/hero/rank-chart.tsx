/* Benchmark evidence is visible immediately; selection never waits for motion. */
"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { CrossTierLine, HomeData } from "@/components/home/home-data";
import { drawSchedule, pathSegments, toPathD } from "@/components/home/rank-chart-style";
import { formatOrdinal } from "@/lib/format";
import { overallStandings } from "./rank-standing";
import { RANK_GRID, rankColumnX, rankLabelInset, rankLabelInsetCss, rankPlotRight, rankPlotX } from "./rank-chart-layout";
import { rankPaint } from "../home-evidence";
import { SizePicker, selectedView } from "./hero-ui";
import { HeroValues } from "./hero-values";
import { useChartHighlight, type ChartHighlight } from "./highlight";
import { DRAW_MS, DRAW_STAGGER_MS, useHomeMotion } from "../home-motion";

const FRAME = { height: 212, top: 18, bottom: 18, left: 34, right: 12 };

/**
 * Every path is normalized to this length via the native SVG `pathLength`
 * presentation attribute, so `stroke-dasharray`/`stroke-dashoffset` can be
 * expressed as plain fractions of it — independent of the path's actual
 * geometric length, which briefly changes right after mount, once the
 * chart's tracked width switches from 0 (SSR) to its real pixel value.
 */
const PATH_UNIT = 1000;

/** Below this width the end labels collide with the plotted area; the
    legend beneath the chart already names every product, so hide them.
    `.rank-frame` in globals.css drops the reserved strip at the same width —
    keep the two in step. */
const END_LABEL_MIN_WIDTH = 640;

/** End labels are drawn at `fontSize="11"` in the mono stack, whose advance
    width is 0.6em — so a name's width is measurable from its length alone,
    without a text-metrics round trip during render. */
const END_LABEL = { gap: 8, charWidth: 6.6, slack: 2 };

/** Horizontal room the longest end label needs to the right of its point. */
function endLabelReach(names: string[]) {
  const chars = Math.max(0, ...names.map(name => name.length));
  return END_LABEL.gap + chars * END_LABEL.charWidth + END_LABEL.slack;
}

export function RankChart({ compact = false, data, highlight: highlightProp, selected, onSelect, captionId, showValues = true }: {
  compact?: boolean;
  data: HomeData;
  highlight?: ChartHighlight;
  selected: number;
  onSelect: (index: number) => void;
  captionId: string;
  showValues?: boolean;
}) {
  const localHighlight = useChartHighlight();
  const highlight = highlightProp ?? localHighlight;
  const [frame, frameWidth] = useTrackedWidth();
  const { enabled } = useHomeMotion();
  // Until the frame is measured every column collapses onto the axis, so the
  // server's markup is a 24px-wide sliver with four product names stacked on
  // top of each other. `.rank-ink` holds that first paint back (the grid and
  // the rank labels are already correct, so the chart's frame is there from
  // the start) and the draw waits with it — starting the pen on geometry that
  // is about to be rewritten is what made the entrance read as a glitch.
  const measured = frameWidth > 0;
  const drawing = enabled && measured;
  const active = highlight.pinned ?? highlight.hovered;
  const standings = overallStandings(data.rankTier.lines);
  const lines = standings.map(standing => standing.line);
  const tiers = data.rankTier.tiers;
  const ranks = Math.max(1, ...lines.flatMap(line => line.points.map(point => point.rank ?? 1)));
  const height = Math.max(FRAME.height, ranks * 28 + FRAME.top + FRAME.bottom);
  const view = selectedView(data, selected);
  const showEndLabels = frameWidth === 0 || frameWidth >= END_LABEL_MIN_WIDTH;
  // The reserved strip shrinks the plot and the picker together, so the
  // buttons stay aligned with the columns they select.
  const labelReach = endLabelReach(lines.map(line => line.name));
  const labelGutter = showEndLabels && frameWidth > 0
    ? rankLabelInset(frameWidth, tiers.length, labelReach, FRAME.right)
    : 0;
  // Numeric-only x, for building `<path>` `d` strings (which cannot hold a
  // CSS calc() fallback); the guide line below keeps the calc() fallback via
  // `rankPlotX` directly, same as before, for a jump-free first paint.
  const x = (index: number) => rankColumnX(frameWidth, tiers.length, index, labelGutter);
  const y = (rank: number) => FRAME.top + (height - FRAME.top - FRAME.bottom) * (rank - 1) / Math.max(1, ranks - 1);
  const selectedX = rankPlotX(frameWidth, tiers.length, selected, labelGutter);

  const geometry = lines.map((line, index) => {
    const segments = pathSegments(line, x, y);
    return { line, index, segments, schedule: drawSchedule(segments), last: segments.at(-1)?.at(-1) ?? null };
  });
  const endLabelOffsets = collidingEndLabels(geometry);

  return (
    // The picker and the caption take the reserved strip from CSS, not from
    // the measurement: the same inset written as a calc() of the chart's own
    // width, so they lay out correctly on the first paint instead of starting
    // full width and snapping in once the ResizeObserver reports. The SVG
    // keeps the numeric one, since a `d` string cannot hold a calc().
    <div ref={frame} className="rank-frame min-w-0 w-full max-md:mt-1" style={{ "--rank-axis-gutter": `${RANK_GRID.axisGutter}px`, "--rank-label-gutter": rankLabelInsetCss(tiers.length, labelReach, FRAME.right) } as CSSProperties}>
      <p className="mb-3 flex flex-col gap-0.5 text-note text-muted-foreground">
        <span>Cache-exceeding rank at each compute size</span>
        <span>1st = highest tpm/$</span>
      </p>
      <svg className="block w-full overflow-visible font-mono" width="100%" height={height} role="img" aria-describedby={captionId}>
        <title>Cache-exceeding rank by tpm/$ at each compute size.</title>
        {Array.from({ length: ranks }, (_, index) => index + 1).map(rank => (
          <g key={rank}>
            <line x1={FRAME.left} x2={rankPlotRight(frameWidth, FRAME.right + labelGutter)} y1={y(rank)} y2={y(rank)} stroke="var(--border)" />
            <text x="0" y={y(rank)} dominantBaseline="middle" fill="var(--muted-foreground)" fontSize="12">{formatOrdinal(rank)}</text>
          </g>
        ))}
        {/* Everything downstream of a measurement lives in here, hidden
            until there is one. The grid and the rank labels above are already
            at their final positions, so what shows first is the empty chart
            rather than a wrong one. */}
        <g className="rank-ink" data-ready={measured ? "true" : "false"}>
          {/* Only glides once the frame is measured: before that the x is a
              CSS calc() string, which has no numeric value to transition. The
              guide line rides the same 180ms clock as the `.seg-pill` it
              tracks (globals.css), so the two read as one object; a click
              mid-flight retargets the transition rather than restarting it.
              It annotates the selection, so on mount it waits for every line
              to settle — there is nothing to point at until then. */}
          {enabled && typeof selectedX === "number" ? (
            <g
              className={drawing ? "rank-guide rank-guide-in" : "rank-guide"}
              style={{ transform: `translateX(${selectedX}px)`, ...(drawing ? { "--guide-delay": `${DRAW_MS + DRAW_STAGGER_MS * (lines.length - 1)}ms` } : null) } as CSSProperties}
            >
              <line x1="0" x2="0" y1="4" y2={height - 2} stroke="var(--primary)" strokeOpacity="0.3" strokeDasharray="3 4" />
            </g>
          ) : (
            <line x1={selectedX} x2={selectedX} y1="4" y2={height - 2} stroke="var(--primary)" strokeOpacity="0.3" strokeDasharray="3 4" />
          )}
          <g>
            {geometry.map(({ line, index, segments, schedule, last }) => {
              const paint = rankPaint(index);
              // Everything this product owns hangs off one clock, so its line,
              // its dots and its name read as a single arrival.
              const base = index * DRAW_STAGGER_MS;
              const selectedLine = active === line.provider;
              const dimmed = active !== null && !selectedLine;
              return (
                <g className="transition-opacity duration-fast ease-exit" key={line.provider} opacity={dimmed ? 0.18 : 1}>
                  {segments.map((segment, segmentIndex) => {
                    // Moment 1, the signature: on mount only, draw the whole
                    // line via `stroke-dashoffset`, staggered per product. A CSS
                    // animation, so React re-renders (hover, selection, a resize
                    // that rewrites `d`) can never restart it — the node is
                    // never replaced, and an animation that has finished stays
                    // finished. The class is the only thing that arrives with
                    // the measurement, so the pen starts once, on the real
                    // geometry. Its end state is the plain path; reduced-motion
                    // and keyboard mode are gated out via `enabled` and
                    // neutralised again in CSS, so either way the complete chart
                    // is there.
                    //
                    // A line broken by a missing size is several paths sharing
                    // one clock: each gets its own slice of `DRAW_MS`, sized by
                    // its share of the length, so the halves draw in sequence at
                    // one pen speed instead of both at once.
                    const span = schedule.spans[segmentIndex];
                    return (
                      <path
                        className={drawing ? "rank-draw" : undefined}
                        d={toPathD(segment)}
                        fill="none"
                        key={segmentIndex}
                        pathLength={drawing ? PATH_UNIT : undefined}
                        stroke={paint.color}
                        strokeDasharray={drawing ? PATH_UNIT : undefined}
                        strokeLinecap="round"
                        strokeWidth={paint.width}
                        style={drawing ? { "--draw-ms": `${Math.round(DRAW_MS * (span.to - span.from))}ms`, "--draw-delay": `${Math.round(base + DRAW_MS * span.from)}ms` } as CSSProperties : undefined}
                      />
                    );
                  })}
                  {/* The selected dot grows on `transform`, not on `r`: the
                      attribute is not a compositable property, and a
                      non-scaling stroke keeps its ring exactly 1.5px wide
                      while the disc scales 2.5 → 4.5. Which is why the
                      entrance rides a wrapper instead: a finished `animation`
                      on the circle's own `transform` would outrank that
                      selection transition forever. Each dot waits for the pen
                      — its delay is its share of the line's length, so a steep
                      climb makes its dot wait longer than a flat run. */}
                  {line.points.map((point, pointIndex) => point.rank === null ? null : (
                    <g
                      className={drawing ? "rank-dot" : undefined}
                      key={point.tier}
                      style={drawing ? { "--dot-delay": `${Math.round(base + DRAW_MS * (schedule.at.get(pointIndex) ?? 0))}ms` } as CSSProperties : undefined}
                    >
                      <circle className="transition-[transform,fill] duration-fast ease-exit" cx={x(pointIndex)} cy={y(point.rank)} r={2.5}
                        style={{ transform: pointIndex === selected ? "scale(1.8)" : "scale(1)", transformBox: "fill-box", transformOrigin: "center" }}
                        vectorEffect="non-scaling-stroke"
                        stroke={paint.color} strokeWidth="1.5" fill={pointIndex === selected ? paint.color : "var(--background)"} />
                    </g>
                  ))}
                  {showEndLabels && last ? (
                    <text
                      className={drawing ? "rank-label" : undefined}
                      dominantBaseline="middle"
                      fill={paint.color}
                      fontSize="11"
                      style={drawing ? { "--label-delay": `${Math.round(base + DRAW_MS)}ms` } as CSSProperties : undefined}
                      x={last.x + 8}
                      y={last.y + (endLabelOffsets.get(line.provider) ?? 0)}
                    >
                      {line.name}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        </g>
      </svg>
      <div className="mt-2 ml-[var(--rank-axis-gutter)] rank-gutter"><SizePicker tiers={tiers} selected={selected} onSelect={onSelect} /></div>
      <p className="mt-2.5 ml-[var(--rank-axis-gutter)] rank-gutter text-note text-muted-foreground" aria-live="polite">
        Inspecting {view.label} · {view.instanceSpec}
      </p>
      {showValues ? (
        <div className="mt-5">
          <HeroValues captionId={captionId} compact={compact} data={data} highlight={highlight} selected={selected} />
        </div>
      ) : null}
    </div>
  );
}

/** Two lines that finish at the same rank (a tie) land on the same y at the
    last plotted size; stagger their end labels vertically so they stay
    readable instead of overlapping. */
function collidingEndLabels(geometry: Array<{ line: CrossTierLine; last: { x: number; y: number } | null }>) {
  const groups = new Map<number, string[]>();
  for (const { line, last } of geometry) {
    if (!last) continue;
    const key = Math.round(last.y);
    const group = groups.get(key);
    if (group) group.push(line.provider);
    else groups.set(key, [line.provider]);
  }
  const offsets = new Map<string, number>();
  for (const providers of groups.values()) {
    if (providers.length < 2) continue;
    providers.forEach((provider, index) => {
      offsets.set(provider, (index - (providers.length - 1) / 2) * 11);
    });
  }
  return offsets;
}

function useTrackedWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const next = el.clientWidth;
      setWidth(current => (current === next ? current : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}
