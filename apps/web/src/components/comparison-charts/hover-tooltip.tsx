import { formatInteger } from "@/lib/format";

import { formatMinutes } from "./overlay-series";

export type OverlayTooltipItem = {
  color: string;
  name: string;
  value: number;
};

export function OverlayHoverTooltip({
  items,
  tSeconds,
}: {
  items: OverlayTooltipItem[];
  tSeconds: number;
}) {
  const ranked = [...items].sort((left, right) => right.value - left.value);
  if (ranked.length === 0) return null;

  return (
    <div className="w-full rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{formatMinutes(tSeconds)}</div>
      <div className="mt-1.5 grid gap-1.5">
        {ranked.map((item) => (
          <div
            className="flex items-center justify-between gap-4 whitespace-nowrap"
            key={item.name}
          >
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground" title={item.name}>
              <span
                aria-hidden="true"
                className="size-2 shrink-0 border border-border/40"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="shrink-0 font-mono font-medium tabular-nums text-foreground">
              {`${formatInteger(item.value)} tpm`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
