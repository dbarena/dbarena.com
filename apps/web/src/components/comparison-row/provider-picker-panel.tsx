"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { ProviderIdentity } from "@/components/comparison-identity/provider-identity";
import type { BenchmarkSummary } from "@/lib/benchmarks";
import {
  formatBoundType,
  isColumnTier,
  isProviderSlug,
  lookupBenchmark,
  providerDescription,
  TIER_OPTIONS,
  type BoundType,
  type ColumnProvider,
  type ColumnTier,
} from "@/lib/catalog";
import { formatInteger, formatMoney } from "@/lib/format";

import { ConfigurationCommandList } from "./configuration-command-list";

export function ProviderPickerPanel({
  boundType,
  catalog,
  occupied,
  onSelect,
  onPreview,
  previewProvider,
  previewTier,
  provider,
  tier,
}: {
  boundType: BoundType;
  catalog: Map<string, BenchmarkSummary>;
  occupied: ReadonlySet<string>;
  onPreview: (provider: ColumnProvider, tier: ColumnTier, variant: string | null) => void;
  onSelect: (provider: ColumnProvider, tier: ColumnTier, variant: string | null) => void;
  previewProvider: ColumnProvider;
  previewTier: ColumnTier;
  provider: ColumnProvider;
  tier: ColumnTier;
}) {
  const previewBenchmark = lookupBenchmark(
    catalog,
    previewProvider,
    previewTier,
    boundType,
  );
  const previewTierOption = TIER_OPTIONS.find(
    (option) => option.id === previewTier,
  );

  return (
    <div className="grid items-start gap-2 md:grid-cols-[18rem_20rem]">
      <Card className="gap-0 py-0" size="sm">
        <Command
          className="rounded-xl p-0 [&_[data-slot=command-input-wrapper]]:p-2 [&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:bg-transparent [&_[data-slot=input-group]]:shadow-none!"
          loop
          onValueChange={(value) => {
            const [nextProvider, nextTier] = value.split(":") as [
              ColumnProvider,
              ColumnTier,
            ];

            if (isProviderSlug(nextProvider) && isColumnTier(nextTier)) {
              onPreview(nextProvider, nextTier, null);
            }
          }}
          value={`${previewProvider}:${previewTier}`}
        >
          <CommandInput
            aria-label="Search providers and sizes"
            placeholder="Search providers and sizes…"
          />
          <Separator />
          <CommandList className="max-h-72 p-1">
            <ConfigurationCommandList
              boundType={boundType}
              catalog={catalog}
              occupied={occupied}
              onPreview={onPreview}
              onSelect={onSelect}
              selectedProvider={provider}
              selectedTier={tier}
            />
          </CommandList>
        </Command>
      </Card>

      {previewBenchmark ? (
        <Card className="hidden min-w-0 md:flex" size="sm">
          <CardHeader className="border-b">
            <CardTitle className="font-normal">
              <ProviderIdentity
                provider={previewProvider}
                secondary={previewTierOption?.label}
              />
            </CardTitle>
            <CardDescription>
              {providerDescription(previewProvider)} The current{" "}
              {previewTierOption?.label.toLowerCase()} configuration uses{" "}
              {previewBenchmark.vcpu ?? "—"} vCPU and{" "}
              {previewBenchmark.ramGb ?? "—"} GiB for the{" "}
              {formatBoundType(boundType).toLowerCase()} scenario.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <dl className="text-sm">
              <div className="flex items-center justify-between gap-4 px-3 py-3">
                <dt className="text-muted-foreground">Instance</dt>
                <dd className="font-mono">{previewBenchmark.instanceType}</dd>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4 px-3 py-3">
                <dt className="text-muted-foreground">Compute / Memory</dt>
                <dd className="font-mono">
                  {previewBenchmark.vcpu ?? "—"} vCPU ·{" "}
                  {previewBenchmark.ramGb ?? "—"} GiB
                </dd>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4 px-3 py-3">
                <dt className="text-muted-foreground">Monthly price</dt>
                <dd className="font-mono font-medium text-primary">
                  {formatMoney(previewBenchmark.monthlyUsd)}
                </dd>
              </div>
            </dl>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Benchmark</span>
              <span className="font-mono">
                {formatInteger(previewBenchmark.terminalThroughput)} tpm
              </span>
            </div>
            <div
              aria-label="Complete benchmark coverage"
              className="grid grid-cols-24"
              role="img"
            >
              {Array.from({ length: 24 }, (_, index) => (
                <span className="h-6 border-l border-primary/60" key={index} />
              ))}
            </div>
            <div className="flex justify-between gap-2 font-mono text-[10px] text-muted-foreground">
              <span>
                {formatInteger(previewBenchmark.terminalP95LatencyMs)} ms p95
              </span>
              <span>
                {previewBenchmark.terminalThroughputPerDollar === null
                  ? "—"
                  : `${formatInteger(previewBenchmark.terminalThroughputPerDollar)} tpm/$`}
              </span>
            </div>
          </CardFooter>
        </Card>
      ) : null}
    </div>
  );
}
