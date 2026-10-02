import { Frame, type MarkState } from "./protocol-mark-frame";

const ROW_H = 22;
const ROW_GAP = 5;
/** Three log rows, the block centred on the sheet. */
const ROWS = [0, 1, 2].map((i) => 50 - (ROW_H + ROW_GAP) + i * (ROW_H + ROW_GAP));

/** The third attempt briefly aborts, then rebuilds into the third clean run. */
export function RunMark(state: MarkState) {
  return (
    <Frame {...state}>
      {ROWS.map((cy, i) => (
        <g className={`protocol-run-row protocol-run-row-${i}`} key={i}>
          <rect className="machine-face" x="40" y={cy - ROW_H / 2} width="200" height={ROW_H} rx="4" />
          <path className="machine-edge" d={`M70 ${cy - ROW_H / 2}v${ROW_H}`} />
          <text className="protocol-run-number" x="49" y={cy + 3.2}>0{i + 1}</text>
          <path className="machine-edge" d={`M82 ${cy - 3}h${72 - i * 10}m-${72 - i * 10} 6h${48 + i * 9}`} />
          <circle className="protocol-run-ring" cx="224" cy={cy} r="6.5" />
          <path className="protocol-run-check" d={`m221 ${cy} 2 2 4-4`} />
          {i === 2 ? <path className="protocol-run-abort" d={`M221 ${cy}h6`} /> : null}
        </g>
      ))}
    </Frame>
  );
}

/** The result panel with its per-second trace, and the published document
    beside it. */
export function PublishMark(state: MarkState) {
  return (
    <Frame {...state}>
      <rect className="machine-face" x="37" y="16" width="152" height="68" rx="5" />
      <path className="machine-edge" d="M37 30h152" />
      <circle className="protocol-status-dot" cx="46" cy="23" r="1.5" />
      <path className="machine-edge" d="M53 23h24" />
      <path className="machine-guides" d="M49 50h128M49 66h128" />
      <path className="protocol-spark-fill" d="M49 72 65 63 79 68 94 50 107 58 124 40 138 51 154 38 177 44V78H49Z" />
      <path className="protocol-spark" d="M49 72 65 63 79 68 94 50 107 58 124 40 138 51 154 38 177 44" />
      <g className="protocol-document">
        <path className="machine-face" d="M197 26h32l14 14v50h-46Z" />
        <path className="machine-edge" d="M229 26v14h14" />
        <path className="protocol-document-check" d="m207 41 3 3 6-6" />
        <path className="machine-circuit" d="M205 56h30m-30 8h22m-22 8h30" />
      </g>
    </Frame>
  );
}
