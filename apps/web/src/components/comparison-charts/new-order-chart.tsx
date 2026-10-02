"use client";

import { memo, useState } from "react";

import { OverlayHoverTooltip } from "@/components/comparison-charts/hover-tooltip";
import {
  areaPath,
  fillId,
  formatAxisTpm,
  formatMinutes,
  linePath,
  seriesMark,
  seriesPoints,
  valueAtTime,
  xTicks,
  type OverlayColumn,
} from "@/components/comparison-charts/overlay-series";
function hoverMarks(
  columns: OverlayColumn[],
  plotted: OverlayColumn[],
  tSeconds: number,
  ceiling: number,
) {
  return plotted.flatMap((column) => {
    const value = valueAtTime(column.series, tSeconds);
    if (value == null) return [];
    return [
      {
        color: seriesMark(columns, column).color,
        name: column.name,
        value,
        y: Math.min(
          100,
          Math.max(0, ceiling <= 0 ? 100 : 100 - (value / ceiling) * 100),
        ),
      },
    ];
  });
}

type ChartProps = {
  ceiling: number;
  columns: OverlayColumn[];
  hiddenIds: ReadonlySet<string>;
  renderColumns: OverlayColumn[];
  rows: Record<string, number | null>[];
  ticks: number[];
  visibleColumns: OverlayColumn[];
  xMax: number;
};

// Hover feedback must not rebuild the benchmark paths on every pointer move.
const ChartPlot = memo(function ChartPlot({ ceiling, columns, hiddenIds, renderColumns, rows, ticks, xMax }: Omit<ChartProps, "visibleColumns">) {
  return (
    <svg
      aria-hidden="true"
      className="h-full w-full overflow-visible"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {ticks.map((tick) => {
        const y =
          ceiling <= 0 ? 100 : 100 - (tick / ceiling) * 100;
        return (
          <line
            key={tick}
            stroke="var(--border)"
            strokeDasharray="3 4"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            x1="0"
            x2="100"
            y1={y}
            y2={y}
          />
        );
      })}
      <defs>
        {renderColumns.map((column) => {
          const mark = seriesMark(columns, column);
          const id = fillId(column.id);
          return (
            <linearGradient
              id={id}
              key={id}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={mark.color}
                stopOpacity="0.12"
              />
              <stop
                offset="100%"
                stopColor={mark.color}
                stopOpacity="0"
              />
            </linearGradient>
          );
        })}
      </defs>
      {renderColumns.map((column) => {
        const points = seriesPoints(rows, column.id, xMax, ceiling);
        const mark = seriesMark(columns, column);
        const hidden = hiddenIds.has(column.id);
        return (
          <g
            className="opacity-100 transition-opacity duration-200 ease-out"
            key={column.id}
            style={hidden ? { opacity: 0 } : undefined}
          >
            <path d={areaPath(points)} fill={`url(#${fillId(column.id)})`} />
            <path
              d={linePath(points)}
              fill="none"
              stroke={mark.color}
              strokeLinejoin="round"
              strokeWidth={mark.width}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}
    </svg>
  );
});

export function NewOrderChart({
  ceiling,
  columns,
  hiddenIds,
  renderColumns,
  rows,
  ticks,
  visibleColumns,
  xMax,
}: ChartProps) {
  const [hover, setHover] = useState<{ time: number; width: number; height: number } | null>(null);
  const hoverT = hover?.time ?? null;
  const yLabels = [...ticks].reverse();
  const xLabels = xTicks(xMax);
  const cursorX =
    hoverT != null && xMax > 0 ? (hoverT / xMax) * 100 : null;
  const marks =
    hoverT == null ? [] : hoverMarks(columns, visibleColumns, hoverT, ceiling);

  return (
    <div className="relative min-h-44 flex-1 overflow-hidden pb-2">
      <div className="absolute inset-0 grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_2rem] gap-x-2 gap-y-1.5">
        <div className="flex flex-col justify-between py-px text-right text-[11px] leading-none text-muted-foreground tabular-nums">
          {yLabels.map((tick) => (
            <span key={tick}>{formatAxisTpm(tick)}</span>
          ))}
        </div>
        <div
          className="relative min-h-0 min-w-0"
          onPointerLeave={() => setHover(null)}
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (bounds.width <= 0 || xMax <= 0) return;
            const ratio = Math.min(
              1,
              Math.max(0, (event.clientX - bounds.left) / bounds.width),
            );
            setHover({ time: ratio * xMax, width: bounds.width, height: bounds.height });
          }}
        >
          <ChartPlot ceiling={ceiling} columns={columns} hiddenIds={hiddenIds} renderColumns={renderColumns} rows={rows} ticks={ticks} xMax={xMax} />
          {cursorX != null ? (
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-0"
              style={{ transform: `translateX(${cursorX / 100 * (hover?.width ?? 0)}px)` }}>
              <div className="h-full w-0 border-l border-dashed border-muted-foreground/45" />
            </div>
          ) : null}
          {cursorX != null
            ? marks.map((mark) => (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 left-0 z-[1] size-2.5 rounded-full border-2 border-background"
                  key={mark.name}
                  style={{
                    backgroundColor: mark.color,
                    transform: `translate(${cursorX / 100 * (hover?.width ?? 0)}px, ${mark.y / 100 * (hover?.height ?? 0)}px) translate(-50%, -50%)`,
                  }}
                />
              ))
            : null}
          {hoverT != null && cursorX != null && marks.length > 0 ? (
            <div
              className="pointer-events-none absolute inset-x-0 top-2 z-10"
            >
              <div className="md:hidden"><OverlayHoverTooltip items={marks} tSeconds={hoverT} /></div>
              <div className="hidden w-0 md:block" style={{ transform: `translateX(${cursorX / 100 * (hover?.width ?? 0)}px)` }}>
                <div className="w-max" style={{ transform: cursorX > 50 ? "translateX(calc(-100% - 8px))" : "translateX(8px)" }}>
                  <OverlayHoverTooltip items={marks} tSeconds={hoverT} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <div />
        <div className="relative text-[11px] leading-none text-muted-foreground">
          {xLabels.map((tick, index) => {
            const left = xMax <= 0 ? 0 : (tick / xMax) * 100;
            const isFirst = index === 0;
            const isLast = index === xLabels.length - 1;
            return (
              <span
                className="absolute top-3"
                key={tick}
                style={{
                  left: `${left}%`,
                  transform: isLast
                    ? "translateX(-100%)"
                    : isFirst
                      ? "none"
                      : "translateX(-50%)",
                }}
              >
                {formatMinutes(tick)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
