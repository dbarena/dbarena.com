import type { CSSProperties } from "react";
import type { ProtocolLabel } from "../home-copy";
import { Frame, type MarkState } from "./protocol-mark-frame";
import { PublishMark, RunMark } from "./protocol-mark-live";
import { Plate } from "./machine-parts";

export function ProtocolMark({ kind, className, playing = false, done = false }: {
  className?: string; kind: ProtocolLabel; playing?: boolean; done?: boolean;
}) {
  const state = { className, done, playing };
  switch (kind) {
    case "Match": return <MatchMark {...state} />;
    case "Load": return <LoadMark {...state} />;
    case "Run": return <RunMark {...state} />;
    case "Publish": return <PublishMark {...state} />;
  }
}

/** Four stations, 60 apart, centred on the sheet. */
const STATION_X = [50, 110, 170, 230];

/** Four processors on one bus, one per product. Unmatched they sit at
    different heights; matched, their top edges line up and each one's
    status LED comes on. */
const CHIP_TOP = 26;
const CHIP_H = 40;
const BUS_Y = 74;

function MatchMark(state: MarkState) {
  return (
    <Frame {...state}>
      <path className="machine-circuit" d={`M${STATION_X[0]} ${BUS_Y}H${STATION_X[3]}${STATION_X.map((x) => `M${x} ${CHIP_TOP + CHIP_H}V${BUS_Y}`).join("")}`} />
      {STATION_X.map((x, i) => (
        <g className={`protocol-match-node protocol-match-node-${i}`} key={x} style={{ animationDelay: `${i * 70}ms` }}>
          <path className="machine-pin" d={`M${x - 15} ${CHIP_TOP - 6}v6m10-6v6m10-6v6m10-6v6`} />
          <rect className="machine-face" x={x - 22} y={CHIP_TOP} width="44" height={CHIP_H} rx="5" />
          <path className="machine-edge" d={`M${x - 22} ${CHIP_TOP + 11}h44`} />
          <circle className="protocol-match-dot" cx={x - 14} cy={CHIP_TOP + 5.5} r="1.5" />
          <path className="machine-edge" d={`M${x - 8} ${CHIP_TOP + 5.5}h14`} />
          {[-11, 3].map((offset) => <rect className="protocol-core" x={x + offset} y={CHIP_TOP + 17} width="8" height="14" rx="1.5" key={offset} />)}
        </g>
      ))}
    </Frame>
  );
}

/** One, two, three, four plates: the dataset scaled to the machine. */
const STACK_BASE = 64;
const STACK_PITCH = 12;

function LoadMark(state: MarkState) {
  return (
    <Frame {...state}>
      {[1, 2, 3, 4].map((layers, i) => (
        <g key={layers}>
          {Array.from({ length: layers }, (_, layer) => (
            <g className="protocol-load-layer" key={layer} style={{ animationDelay: `${i * 100 + layer * 120}ms` } as CSSProperties}>
              <Plate x={STATION_X[i]} y={STACK_BASE - layer * STACK_PITCH} width={52} accent={i === 3 && layer === 3} leds={layer === layers - 1} slot={false} />
            </g>
          ))}
        </g>
      ))}
    </Frame>
  );
}
