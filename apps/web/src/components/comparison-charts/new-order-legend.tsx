import { ChevronDownIcon, PlusIcon } from "lucide-react";

import { ProviderLogo } from "@/components/provider-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  endSeconds,
  formatClients,
  formatMinutes,
  isShortRun,
  seriesMark,
  type OverlayColumn,
} from "./overlay-series";

export function ChartProducts({
  columns,
  hiddenIds,
  onToggle,
  onShowAll,
}: {
  columns: OverlayColumn[];
  hiddenIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onShowAll: () => void;
}) {
  const visibleCount = columns.filter((column) => !hiddenIds.has(column.id)).length;

  return (
    <Popover>
      <PopoverTrigger render={<Button className="h-11 gap-2 sm:h-9" variant="outline" />}>
        Products
        <span className="rounded-sm bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">
          {visibleCount}/{columns.length}
        </span>
        <ChevronDownIcon aria-hidden="true" className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 gap-1 p-1.5">
        <div className="px-2 py-2">
          <PopoverTitle className="text-[13px]">Products on chart</PopoverTitle>
          <PopoverDescription className="mt-1 text-xs">
            Choose lines to show. The table stays the same.
          </PopoverDescription>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {columns.map((column) => (
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-sm px-2 py-2 text-[13px] hover:bg-muted focus-within:bg-muted" key={column.id}>
              <input
                checked={!hiddenIds.has(column.id)}
                className="size-4 shrink-0 accent-primary"
                onChange={() => onToggle(column.id)}
                type="checkbox"
              />
              <ProviderLogo className="size-4 text-muted-foreground" monochrome provider={column.provider} />
              <span className="min-w-0 flex-1" translate="no">{column.name}</span>
              {!column.series?.length ? <span className="text-[11px] text-muted-foreground">No samples</span> : null}
            </label>
          ))}
        </div>
        <div className="border-t border-border pt-1">
          <Button className="w-full justify-start text-xs" disabled={visibleCount === columns.length} onClick={onShowAll} variant="ghost">
            Show all products
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function NewOrderLegend({
  columns,
  hiddenIds,
  longestEnd,
  mixedClients,
  onToggle,
}: {
  columns: OverlayColumn[];
  hiddenIds: ReadonlySet<string>;
  /** End of the longest run on the chart, the baseline a short run is short against. */
  longestEnd: number;
  mixedClients: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <ul aria-label="Chart products" className="flex max-w-full flex-wrap gap-2">
      {columns.map((column) => {
        const mark = seriesMark(columns, column);
        const missing = !column.series?.length;
        const stoppedAt = isShortRun(column.series, longestEnd) ? endSeconds(column.series) : null;
        const hidden = hiddenIds.has(column.id);
        const label = hidden ? `Show ${column.name} on chart` : `Hide ${column.name} from chart`;

        return (
          <li key={column.id}>
            <button
              aria-label={label}
              aria-pressed={!hidden}
              className={cn(
                "group flex min-h-11 max-w-full items-center gap-2 rounded-sm border border-border bg-background px-2.5 py-1.5 text-[12px] transition-[opacity,background-color,border-color,color] duration-150 ease-out hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:min-h-8",
                hidden && "opacity-40 hover:opacity-100",
              )}
              onClick={() => onToggle(column.id)}
              title={label}
              type="button"
            >
              <span aria-hidden="true" className="h-0.5 w-4 shrink-0 rounded-full" style={{ backgroundColor: missing ? "var(--muted-foreground)" : mark.color }} />
              <span translate="no">{column.name}</span>
              {mixedClients ? <span className="text-muted-foreground">{formatClients(column.clients)}</span> : null}
              {missing ? <span className="text-muted-foreground">No samples</span> : stoppedAt != null ? <span className="text-muted-foreground">Ends {formatMinutes(stoppedAt)}</span> : null}
              <PlusIcon
                aria-hidden="true"
                className={cn(
                  "size-3 shrink-0 text-muted-foreground transition-transform duration-150 ease-out motion-reduce:transition-none group-hover:text-foreground",
                  !hidden && "rotate-45",
                )}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
