"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import { ProviderLogo } from "@/components/provider-logo";
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import type { BenchmarkSummary } from "@/lib/benchmarks";
import type { BoundType, ColumnProvider, ColumnTier } from "@/lib/catalog";
import { hostName } from "@/lib/comparison-providers";
import { ConfigurationPicker } from "./configuration-picker";

export function ProviderPicker({
  benchmarks, boundType, columnNumber, host, occupied, onSelectConfiguration, provider, tier, variant,
}: {
  benchmarks: BenchmarkSummary[];
  boundType: BoundType;
  columnNumber: number;
  host: string;
  occupied: ReadonlySet<string>;
  onSelectConfiguration: (provider: ColumnProvider, tier: ColumnTier, variant?: string | null) => void;
  provider: ColumnProvider;
  tier: ColumnTier;
  variant: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger render={<button aria-label={`Comparison ${columnNumber} provider: ${hostName(host)}`} className="flex min-h-11 min-w-0 items-center gap-2 rounded-sm text-left outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring md:min-h-7" title={hostName(host)} type="button" />}>
        <ProviderLogo className="size-5 text-muted-foreground" monochrome provider={host} />
        <span className="truncate text-[13px] font-medium" translate="no">{hostName(host)}</span>
        <ChevronDownIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[calc(100dvh-2rem)] w-[46rem] max-w-[calc(100vw-1.5rem)] gap-0 overflow-hidden p-0" sideOffset={8}>
        <div className="border-b border-border/70 px-4 py-3.5">
          <PopoverTitle className="text-[13px]">Change configuration</PopoverTitle>
          <PopoverDescription className="mt-1 text-xs">Select a product and size for this column.</PopoverDescription>
        </div>
        <ConfigurationPicker benchmarks={benchmarks} boundType={boundType} occupied={occupied} preferredTier={tier} selectedProduct={provider} selectedVariant={variant} onSelect={(product, nextTier, nextVariant) => { onSelectConfiguration(product, nextTier, nextVariant); setOpen(false); }} />
      </PopoverContent>
    </Popover>
  );
}
