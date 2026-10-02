"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight } from "lucide-react";
import { useInView } from "motion/react";

import { PROTOCOL_LINES, type ProtocolLine } from "./home-copy";
import { ProtocolMark } from "./marks/protocol-marks";

// Match → Load → three clean runs → published samples → a beat on the
// finished track, then it starts over. The sequence loops for as long as the
// section is in view, so a reader who lingers keeps seeing the explanation.
// Hover holds the sequence: the station in flight plays to its end, then the
// playhead waits until the pointer leaves.

/** How long each station stays lit once its art has played, in PROTOCOL_LINES
    order. Each is that station's own animation length (see the
    `protocol-illustration[data-playing]` rules in home-illustrations.css) plus
    ~400ms to settle — a flat hold left Publish sitting dead for over a second
    before the cut, which is what made the cut read as abrupt. */
const STATION_HOLD_MS = [1300, 1700, 2400, 1550];
/** The outgoing station dips before the playhead commits to the next one. */
const OUT_MS = 260;
const LEAD_IN_MS = 180;
/** The finished track holds full for a beat before the loop restarts. */
const PARK_HOLD_MS = 1800;
const LINES = PROTOCOL_LINES.length;
/** The terminal stage: every station done, the track full, before the loop
    restarts. Stages 1…LINES are the stations; 0 is the lead-in before the
    first. */
const PARKED = LINES + 1;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function readReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function serverReducedMotion() { return false; }

/** "hold" is the station playing out; "out" is the dip before the next one. */
type Phase = "hold" | "out";

export function ProtocolRun() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2, margin: "-32px 0px -48px 0px" });
  // Reduced motion only: the explainer is content, not feedback, so a
  // keystroke elsewhere on the page must not snap it to its done state.
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const enabled = !reduced;
  const [stage, setStage] = useState(0);
  const [phase, setPhase] = useState<Phase>("hold");
  const [holding, setHolding] = useState(false);
  const inspected = useRef(new Set<number>());
  const fills = useRef<(HTMLElement | null)[]>([]);
  /** The active station's fill animation. It is the sequence's clock, not a
      decoration of it: the playhead advances when this animation finishes, so
      the bar can never claim more or less time than the station actually gets. */
  const clock = useRef<Animation | null>(null);
  const remaining = useRef(LEAD_IN_MS);

  // Hover never moves the playhead — it only withholds the next tick, so the
  // station in flight keeps its animation and finishes where it would have.
  function inspect(index: number, on: boolean) {
    if (on) inspected.current.add(index);
    else inspected.current.delete(index);
    setHolding(inspected.current.size > 0);
  }

  // Paint the track for this stage and arm the clock. Deliberately not keyed on
  // `phase`: the out dip must not restart the fill it just finished. Parked and
  // motion-off both land on a full track — a finished run, not a cleared one.
  useEffect(() => {
    clock.current = null;
    for (const [index, el] of fills.current.entries()) {
      if (!el) continue;
      for (const running of el.getAnimations()) running.cancel();
      el.style.transformOrigin = "left center";
      el.style.transform = !enabled || index < stage - 1 ? "scaleX(1)" : "scaleX(0)";
    }
    if (!enabled || stage === 0 || stage === PARKED) return;
    const el = fills.current[stage - 1];
    if (!el) return;
    const fill = el.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
      duration: STATION_HOLD_MS[stage - 1], easing: "linear", fill: "both",
    });
    fill.pause();
    clock.current = fill;
  }, [enabled, stage]);

  useEffect(() => {
    if (!enabled || !inView) return;

    // A station in flight is driven by its own fill. Hover withholds `play()`,
    // which freezes the bar and the playhead together without touching the art.
    if (phase === "hold" && stage > 0 && stage !== PARKED) {
      const fill = clock.current;
      if (!fill) return;
      if (holding) return;
      let stale = false;
      fill.play();
      void fill.finished.then(() => { if (!stale) setPhase("out"); }).catch(() => {});
      return () => { stale = true; fill.pause(); };
    }

    // The beats with no bar of their own: the lead-in, the dip, and the hold
    // on the finished track before the loop restarts.
    if (phase === "hold" && holding) return;
    const holdMs = stage === PARKED ? PARK_HOLD_MS : phase === "out" ? OUT_MS : LEAD_IN_MS;
    remaining.current = Math.min(remaining.current, holdMs);
    const deadline = Date.now() + remaining.current;
    let fired = false;
    const id = window.setTimeout(() => {
      fired = true;
      if (stage === PARKED) {
        remaining.current = LEAD_IN_MS;
        setStage(0);
      } else {
        const next = stage + 1;
        remaining.current = next === PARKED ? PARK_HOLD_MS : OUT_MS;
        setStage(next);
      }
      setPhase("hold");
    }, remaining.current);
    return () => {
      window.clearTimeout(id);
      if (!fired) remaining.current = Math.max(0, deadline - Date.now());
    };
  }, [enabled, inView, holding, stage, phase]);

  return (
    <div
      className="protocol-sequence"
      data-holding={holding || undefined}
      data-motion={enabled}
      data-paused={!inView || undefined}
      data-phase={phase}
      id="protocol"
      ref={ref}
    >
      <div aria-hidden="true" className="protocol-track">
        {PROTOCOL_LINES.map((line, index) => (
          <span key={line.label}>
            <i ref={(el) => { fills.current[index] = el; }} />
          </span>
        ))}
      </div>
      <ol className="protocol-grid">
        {PROTOCOL_LINES.map((line, index) => (
          <li className="min-w-0" key={line.label}>
            <Station
              current={enabled && stage === index + 1}
              done={!enabled || stage > index + 1}
              index={index}
              line={line}
              onInspect={(on) => inspect(index, on)}
              playing={enabled && inView && stage === index + 1}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function Station({ current, done, index, line, onInspect, playing }: {
  current: boolean;
  done: boolean;
  index: number;
  line: ProtocolLine;
  onInspect: (inspecting: boolean) => void;
  playing: boolean;
}) {
  return (
    <a
      aria-current={current ? "step" : undefined}
      className="protocol-card group"
      data-current={current || undefined}
      data-done={done || undefined}
      href={line.href}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) onInspect(true);
      }}
      onPointerLeave={() => onInspect(false)}
      onPointerCancel={() => onInspect(false)}
    >
      <div className="protocol-card-art">
        <ProtocolMark className="protocol-illustration" done={done} kind={line.label} playing={playing} />
      </div>
      <div className="protocol-card-copy">
        <h4 className="flex items-center gap-2.5 text-body font-medium">
          <span className="protocol-step font-mono text-note">{String(index + 1).padStart(2, "0")}</span>
          {line.label}
        </h4>
        <p className="mt-2 text-caption leading-[1.55] text-[color:var(--reading-color)]">{line.text}</p>
      </div>
      <span className="protocol-card-action text-caption">
        More details
        <span aria-hidden="true" className="schematic-arrow"><ArrowUpRight className="size-3.5" /></span>
      </span>
    </a>
  );
}
