"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { BenchmarkSummary } from "@/lib/benchmarks";
import type { BoundType, ColumnProvider, ColumnTier } from "@/lib/catalog";
import { ConfigurationPicker } from "./configuration-picker";

export function ConfigurationChooserDialog({
  benchmarks, boundType, lockedTier, occupied, onOpenChange, onSelectConfiguration, open, preferredTier,
}: {
  benchmarks: BenchmarkSummary[];
  boundType: BoundType;
  lockedTier?: ColumnTier;
  occupied: ReadonlySet<string>;
  onOpenChange: (open: boolean) => void;
  onSelectConfiguration: (provider: ColumnProvider, tier: ColumnTier, variant?: string | null) => void;
  open: boolean;
  preferredTier: ColumnTier;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[46rem] gap-0 overflow-hidden p-0">
        <DialogHeader className="w-full gap-1.5 border-b border-border/70 px-4 py-3.5 pr-10 text-left">
          <DialogTitle>Add a configuration</DialogTitle>
          <DialogDescription className="text-xs">
            {lockedTier ? "Select a product to compare at the same size." : "Select a product and size to compare."}
          </DialogDescription>
        </DialogHeader>
        <ConfigurationPicker benchmarks={benchmarks} boundType={boundType} lockedTier={lockedTier} occupied={occupied} preferredTier={preferredTier} rememberTierFilter={!lockedTier} onSelect={(product, tier, variant) => { onSelectConfiguration(product, tier, variant); onOpenChange(false); }} />
      </DialogContent>
    </Dialog>
  );
}
