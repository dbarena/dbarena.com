"use client";

import { useMemo, useState, type PointerEvent } from "react";

import { ProviderLogo } from "@/components/provider-logo";
import type { ColumnProvider } from "@/lib/catalog";
import { formatInteger, formatValue } from "@/lib/format";
import {
  formatMinutes,
  rollingMedian,
  valueAtTime,
} from "@/components/comparison-charts/overlay-series";

import type { HomeRow } from "./home-data";
import { sparklineCaption } from "./price-latency-model";
import { SwapText } from "./ui/swap-text";

const SPARK = { width: 560, height: 190 };

type Hover = {
  tSeconds: number;
  tpm: number;
  x: number;
  y: number;
  width: number;
};

/** The leader's run at the selected size — the same
    `rollingMedian()` smoothing the `/compare` overlay chart applies.
    Hover is a one-product version of that overlay tooltip: time + tpm,
    a hairline, and a dot. */
export function PriceLatencySpark({ label, row }: { label: string; row: HomeRow | null }) {
  const series = useMemo(() => {
    const raw = row?.series ?? [];
    return raw.length ? rollingMedian(raw) : raw;
  }, [row]);
  const ceiling = Math.max(1, ...series.map((sample) => sample.tpm));
  const span = Math.max(1, series.at(-1)?.tSeconds ?? 1);
  const points = series.map((sample) => ({
    x: (sample.tSeconds / span) * SPARK.width,
    y: SPARK.height - (sample.tpm / ceiling) * SPARK.height,
  }));
  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
  const [hover, setHover] = useState<Hover | null>(null);

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (series.length < 2) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    const ratio = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const tSeconds = ratio * span;
    const tpm = valueAtTime(series, tSeconds);
    if (tpm == null) {
      setHover(null);
      return;
    }
    setHover({
      tSeconds,
      tpm,
      width: bounds.width,
      x: ratio * bounds.width,
      y: bounds.height - (tpm / ceiling) * bounds.height,
    });
  }

  return (
    <div>
      {row ? (
        <p className="flex items-center gap-2 text-caption">
          <ProviderLogo className="size-[18px]" provider={row.provider as ColumnProvider} />
          {row.name}
          <span className="ml-auto font-mono text-[13px] tabular-nums"><SwapText value={formatValue(row.tpm)} /></span>
        </p>
      ) : null}
      {points.length > 1 ? (
        <div
          className="relative mt-4 overflow-visible cursor-crosshair"
          onPointerLeave={() => setHover(null)}
          onPointerMove={onPointerMove}
        >
          <svg
            aria-label={`${row?.name ?? "Product"} throughput across the measured run at ${label}`}
            className="block w-full"
            height="190"
            preserveAspectRatio="none"
            role="img"
            viewBox={`0 0 ${SPARK.width} ${SPARK.height}`}
          >
            <path
              d={`${line} L${SPARK.width} ${SPARK.height} L0 ${SPARK.height} Z`}
              fill="color-mix(in oklab, var(--primary) 14%, transparent)"
            />
            <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          {hover ? <SparkHover hover={hover} /> : null}
          <p className="sr-only" aria-live="polite">
            {hover
              ? `${formatMinutes(hover.tSeconds)}, ${formatInteger(hover.tpm)} transactions per minute`
              : ""}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-caption text-muted-foreground">No samples published at this size yet.</p>
      )}
      <p className="mt-3 font-mono text-2xs text-muted-foreground">{sparklineCaption({ label, row })}</p>
    </div>
  );
}

function SparkHover({ hover }: { hover: Hover }) {
  const flip = hover.x > hover.width * 0.62;
  const left = Math.min(hover.width - 8, Math.max(8, hover.x));
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 h-[190px] w-0 border-l border-dashed border-muted-foreground/45"
        style={{ left: hover.x }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute z-[1] size-2 rounded-full border-2 border-background bg-primary"
        style={{ left: hover.x, top: hover.y, transform: "translate(-50%, -50%)" }}
      />
      <div
        className="pointer-events-none absolute top-2 z-10"
        style={{
          left,
          transform: flip ? "translateX(calc(-100% - 8px))" : "translateX(8px)",
        }}
      >
        <div className="whitespace-nowrap rounded-sm border border-border bg-[color-mix(in_oklab,var(--background)_88%,transparent)] px-2 py-1 font-mono text-[11px] tabular-nums backdrop-blur-sm">
          <span className="text-muted-foreground">{formatMinutes(hover.tSeconds)}</span>
          <span className="ml-2 text-foreground">{formatInteger(hover.tpm)} tpm</span>
        </div>
      </div>
    </>
  );
}
