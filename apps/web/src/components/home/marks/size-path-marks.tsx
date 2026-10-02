import type { ReactNode } from "react";

import { DiagramGuides, Plate } from "./machine-parts";

/**
 * Architectural illustrations, not representations of benchmark results.
 *
 * Each machine is drawn as four stacked SVGs sharing one viewBox — the
 * drawing sheet, then the base, middle and top plates — so that depth is a
 * DOM layer rather than paint order. That is what lets the plates levitate
 * and follow the pointer on the compositor (`home-illustrations.css`
 * transforms the layer elements, never the SVG geometry inside them), and
 * why the guides can hold perfectly still while the machine above them lives.
 */
export function SizePathMark({ kind }: { kind: "side-project" | "production" | "heavy" }) {
  const machine = kind === "side-project" ? COMPUTE_BOARD : kind === "production" ? PRODUCTION_STACK : HEAVY_SYSTEM;
  return (
    <div aria-hidden="true" className="machine-illustration">
      <Layer depth="sheet"><DiagramGuides />{machine.sheet}</Layer>
      <Layer depth="base">{machine.base}</Layer>
      <Layer depth="middle">{machine.middle}</Layer>
      <Layer depth="top">{machine.top}</Layer>
    </div>
  );
}

function Layer({ children, depth }: { children: ReactNode; depth: "sheet" | "base" | "middle" | "top" }) {
  return (
    <div className="machine-layer" data-depth={depth}>
      <svg className="machine-layer-art" fill="none" focusable="false" viewBox="0 0 320 210">{children}</svg>
    </div>
  );
}

type Machine = { sheet?: ReactNode; base: ReactNode; middle?: ReactNode; top: ReactNode };

const COMPUTE_BOARD: Machine = {
  base: (
    <>
      <Plate y={131} width={184} />
      <g className="machine-circuit">
        <path d="m93 125 23-12 20 10m48 0 23-12 20 10m-107 29 20-10m20 22v-17m23 4 18 9" />
        <circle cx="93" cy="125" r="2" /><circle cx="227" cy="121" r="2" />
        <circle cx="120" cy="150" r="2" /><circle cx="201" cy="158" r="2" />
      </g>
      <g className="machine-signal">
        <path d="M68 131 44 143v15m208-27 24 12v15" />
        <circle cx="44" cy="162" r="3" /><circle cx="276" cy="162" r="3" />
      </g>
    </>
  ),
  top: (
    <>
      <Plate y={108} width={88} accent />
      <path className="machine-chip" d="m160 91 26 13-26 13-26-13Z" />
      <path className="machine-chip-detail" d="m151 99 9-4 9 4-9 5Zm0 10 9-5 9 5-9 4Z" />
      <path className="machine-pin" d="m130 98-9-5m15 2-9-5m57 8 9-5m-15 2 9-5m-40 39v8m14-8v8" />
    </>
  ),
};

const PRODUCTION_STACK: Machine = {
  sheet: <path className="machine-guides" d="M84 83v63m152-63v63M160 46v145" strokeDasharray="3 4" />,
  base: (
    <>
      <Plate y={141} />
      <g className="machine-signal">
        <path d="m84 143-28 14v12m180-26 28 14v12" />
        <circle cx="56" cy="173" r="3" /><circle cx="264" cy="173" r="3" />
      </g>
    </>
  ),
  middle: (
    <>
      <Plate y={112} />
      <path className="machine-circuit" d="m113 111 47-23 47 23-47 24Z m24-12 46-23m-70 12 46 23" />
    </>
  ),
  top: (
    <>
      <Plate y={83} accent />
      <path className="machine-chip" d="m160 64 37 19-37 19-37-19Z" />
      <path className="machine-chip-detail" d="m142 83 18-9 18 9-18 9Z m18-9v18m-18-9h36" />
    </>
  ),
};

/* The centre stack sits furthest back, so it is drawn first on every layer;
   the two front stacks paint over it exactly as they did in a single sheet. */
const HEAVY_STACKS = [{ x: 160, y: 84 }, { x: 102, y: 113 }, { x: 218, y: 113 }];

const HEAVY_SYSTEM: Machine = {
  base: (
    <>
      <Plate y={138} width={224} />
      <path className="machine-circuit" d="m82 139 78 39 78-39M160 178v-27m-50-26 50-25 50 25" />
      {HEAVY_STACKS.map(({ x, y }) => <Plate key={x} x={x} y={y + 21} width={64} />)}
      <g className="machine-signal">
        <path d="m48 138-17 9m241-9 17 9M160 185v13" />
        <circle cx="28" cy="149" r="3" /><circle cx="292" cy="149" r="3" /><circle cx="160" cy="201" r="3" />
      </g>
    </>
  ),
  middle: HEAVY_STACKS.map(({ x, y }) => <Plate key={x} x={x} y={y + 7} width={64} />),
  top: HEAVY_STACKS.map(({ x, y }, i) => (
    <g key={x}>
      <Plate x={x} y={y - 7} width={64} accent={i === 0} />
      <path className={i === 0 ? "machine-chip-detail" : "machine-circuit"} d={`m${x} ${y - 14} 14 7-14 7-14-7Z`} />
    </g>
  )),
};
