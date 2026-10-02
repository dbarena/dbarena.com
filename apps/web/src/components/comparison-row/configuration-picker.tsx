"use client";

import { useMemo, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { comparisonName } from "@/lib/comparison-providers";

import { Command, CommandInput, CommandList } from "@/components/ui/command";
import type { BenchmarkSummary } from "@/lib/benchmarks";
import {
  configurationKey,
  indexCatalog,
  isColumnTier,
  TIER_OPTIONS,
  type BoundType,
  type ColumnProvider,
  type ColumnTier,
} from "@/lib/catalog";
import { diskVariantName, isDiskVariant } from "@/lib/comparison-variants";
import { ConfigurationCommandList, configurationGroups } from "./configuration-command-list";
import { ConfigurationPreview } from "./configuration-preview";
import { cn } from "@/lib/utils";

type TierFilter = ColumnTier | "all";

const ADD_TIER_FILTER_STORAGE_KEY = "dbarena:add-tier-filter:v1";

function isTierFilter(value: string | null): value is TierFilter {
  return value === "all" || isColumnTier(value);
}

function initialTierFilter(
  preferredTier: ColumnTier,
  rememberTierFilter: boolean,
): TierFilter {
  if (!rememberTierFilter || typeof window === "undefined") return preferredTier;

  try {
    const savedTierFilter = window.localStorage.getItem(
      ADD_TIER_FILTER_STORAGE_KEY,
    );
    return isTierFilter(savedTierFilter) ? savedTierFilter : preferredTier;
  } catch {
    return preferredTier;
  }
}

export function ConfigurationPicker({
  benchmarks,
  boundType,
  lockedTier,
  occupied,
  onSelect,
  preferredTier,
  rememberTierFilter = false,
  selectedProduct,
  selectedVariant = null,
}: {
  benchmarks: BenchmarkSummary[];
  boundType: BoundType;
  lockedTier?: ColumnTier;
  occupied: ReadonlySet<string>;
  onSelect: (product: ColumnProvider, tier: ColumnTier, variant: string | null) => void;
  preferredTier: ColumnTier;
  rememberTierFilter?: boolean;
  selectedProduct?: ColumnProvider;
  selectedVariant?: string | null;
}) {
  const catalog = useMemo(() => indexCatalog(benchmarks), [benchmarks]);
  const [tierFilter, setTierFilter] = useState<TierFilter>(() =>
    lockedTier ?? initialTierFilter(preferredTier, rememberTierFilter),
  );
  const [search, setSearch] = useState("");
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [previewKey, setPreviewKey] = useState(
    selectedProduct
      ? configurationKey({ provider: selectedProduct, tier: preferredTier, variant: selectedVariant })
      : "",
  );
  const options = useMemo(() => configurationGroups(catalog, boundType, tierFilter, search).flatMap((group) => group.options), [catalog, boundType, tierFilter, search]);
  const preview = options.find((option) =>
    configurationKey({ provider: option.provider, tier: option.tier.id, variant: option.benchmark.variant }) === previewKey,
  )
    ?? options.find((option) =>
      !occupied.has(configurationKey({ provider: option.provider, tier: option.tier.id, variant: option.benchmark.variant })),
    )
    ?? options[0];
  const previewValue = preview
    ? configurationKey({ provider: preview.provider, tier: preview.tier.id, variant: preview.benchmark.variant })
    : "";
  const taken = occupied.has(previewValue);

  function selectTierFilter(nextTierFilter: TierFilter) {
    setTierFilter(nextTierFilter);
    if (!rememberTierFilter) return;

    try {
      window.localStorage.setItem(
        ADD_TIER_FILTER_STORAGE_KEY,
        nextTierFilter,
      );
    } catch {
      // Keep the in-memory selection when storage is unavailable.
    }
  }

  return (
    // A fixed frame keeps the pointer's target still as results and previews
    // change. Each pane scrolls independently when the viewport is short.
    <div className="grid h-[min(29rem,calc(100dvh-10rem))] w-full min-w-0 grid-rows-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_18rem] md:grid-rows-1">
    <Command
      className={cn("h-full min-h-0 min-w-0 w-full justify-start rounded-none! p-0 [&_[data-slot=command-input-wrapper]]:p-0 [&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:bg-transparent [&_[data-slot=input-group]]:shadow-none!", showMobileDetails && "hidden md:flex")}
      loop
      onValueChange={setPreviewKey}
      shouldFilter={false}
      value={previewValue}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border/70 px-3 py-2 focus-within:bg-muted/20 has-focus-visible:border-ring/60 [&>[data-slot=command-input-wrapper]]:min-w-0 [&>[data-slot=command-input-wrapper]]:flex-1">
        <CommandInput aria-label="Search providers or products" className="focus-visible:ring-0" onValueChange={setSearch} placeholder="Search configurations…" value={search} />
        {lockedTier ? (
          <span className="shrink-0 border-l border-border pl-3 text-xs whitespace-nowrap text-muted-foreground">
            {TIER_OPTIONS.find((tier) => tier.id === lockedTier)?.label} only
          </span>
        ) : (
          <label className="relative shrink-0 border-l border-border pl-3">
            <span className="sr-only">Configuration size</span>
            <select
              className="h-9 max-w-28 appearance-none rounded-sm bg-transparent pr-5 pl-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => {
                const value = event.target.value;
                if (isTierFilter(value)) selectTierFilter(value);
              }}
              onKeyDown={(event) => {
                if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) {
                  event.stopPropagation();
                }
              }}
              value={tierFilter}
            >
              <option value="all">All sizes</option>
              {TIER_OPTIONS.map((tier) => <option key={tier.id} value={tier.id}>{tier.label}</option>)}
            </select>
            <ChevronDownIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 right-0 size-3 -translate-y-1/2 text-muted-foreground" />
          </label>
        )}
      </div>
      <CommandList className="min-h-0 flex-1 max-h-none p-1.5 [scrollbar-gutter:stable]">
        <ConfigurationCommandList
          boundType={boundType}
          catalog={catalog}
          occupied={occupied}
          onPreview={(product, size, variant) => setPreviewKey(configurationKey({ provider: product, tier: size, variant }))}
          onSelect={onSelect}
          search={search}
          selectedProvider={selectedProduct}
          selectedTier={preferredTier}
          selectedVariant={selectedVariant}
          tierFilter={tierFilter}
        />
      </CommandList>
    </Command>
    <div className="hidden min-h-0 min-w-0 overflow-y-auto overscroll-contain border-l border-border/70 bg-muted/20 [scrollbar-gutter:stable] md:block">
        <ConfigurationPreview benchmark={preview?.benchmark ?? null} taken={taken} />
    </div>
    <div className={cn("min-h-0 overflow-y-auto overscroll-contain md:hidden", !showMobileDetails && "hidden")}>
      {options.length > 0 ? (
        <label className="block px-4 pt-3">
          <span className="sr-only">Preview configuration</span>
          <select className="h-9 w-full rounded-sm border border-border bg-popover px-2.5 text-xs" onChange={(event) => setPreviewKey(event.target.value)} value={previewValue}>
            {options.map((option) => {
              const value = configurationKey({ provider: option.provider, tier: option.tier.id, variant: option.benchmark.variant });
              const variantLabel = isDiskVariant(option.benchmark.variant)
                ? ` · ${diskVariantName(option.benchmark.variant)}`
                : "";
              return (
                <option key={value} value={value}>
                  {comparisonName(option.benchmark)} · {option.tier.label}{variantLabel}
                </option>
              );
            })}
          </select>
        </label>
      ) : null}
        <ConfigurationPreview benchmark={preview?.benchmark ?? null} taken={taken} />
    </div>
    <button
      className="flex min-h-11 items-center justify-center gap-2 border-t border-border px-4 text-xs text-muted-foreground hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-50 md:hidden"
      disabled={options.length === 0 && !showMobileDetails}
      onClick={() => setShowMobileDetails((show) => !show)}
      type="button"
    >
      {showMobileDetails ? "Back to configurations" : "Configuration details"}
    </button>
    </div>
  );
}
