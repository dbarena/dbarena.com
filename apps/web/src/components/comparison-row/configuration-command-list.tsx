"use client";

import { Fragment } from "react";

import { ProviderLogo } from "@/components/provider-logo";
import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import type { BenchmarkSummary } from "@/lib/benchmarks";
import {
  configurationKey,
  TIER_OPTIONS,
  type BoundType,
  type ColumnProvider,
  type ColumnTier,
} from "@/lib/catalog";
import { comparisonProviders, productName } from "@/lib/comparison-providers";
import {
  configurationResults,
  diskVariantName,
  isDiskVariant,
} from "@/lib/comparison-variants";
import { formatMoney } from "@/lib/format";

export function configurationGroups(
  catalog: Map<string, BenchmarkSummary>,
  boundType: BoundType,
  tierFilter: ColumnTier | "all",
  search: string,
) {
  const terms = search.trim().toLowerCase().split(/\s+/);
  return comparisonProviders(catalog.values()).map((group) => ({
    ...group,
    options: group.products.flatMap((provider) =>
      TIER_OPTIONS.filter((tier) => tierFilter === "all" || tier.id === tierFilter)
        .flatMap((tier) =>
          configurationResults(catalog.values(), provider, tier.id, boundType).flatMap((benchmark) => {
            const variantLabel = isDiskVariant(benchmark.variant)
              ? diskVariantName(benchmark.variant)
              : null;
            const text = [group.name, provider, productName(provider), tier.label, variantLabel,
              `${benchmark.vcpu} vCPU`, `${benchmark.ramGb} GiB`, benchmark.instanceType]
              .filter(Boolean)
              .join(" ").toLowerCase();
            return terms.every((term) => text.includes(term))
              ? [{ provider, tier, benchmark }]
              : [];
          }),
        ),
    ),
  })).filter((group) => group.options.length > 0);
}

export function ConfigurationCommandList({
  boundType,
  catalog,
  occupied,
  onPreview,
  onSelect,
  selectedProvider,
  selectedTier,
  selectedVariant,
  tierFilter = "all",
  search = "",
}: {
  boundType: BoundType;
  catalog: Map<string, BenchmarkSummary>;
  occupied: ReadonlySet<string>;
  onPreview?: (provider: ColumnProvider, tier: ColumnTier, variant: string | null) => void;
  onSelect: (provider: ColumnProvider, tier: ColumnTier, variant: string | null) => void;
  selectedProvider?: ColumnProvider;
  selectedTier?: ColumnTier;
  selectedVariant?: string | null;
  tierFilter?: ColumnTier | "all";
  search?: string;
}) {
  const groups = configurationGroups(catalog, boundType, tierFilter, search);

  return (
    <>
      <CommandEmpty>No matching configurations. Try another size or search term.</CommandEmpty>
      {groups.map((group, index) => (
        <Fragment key={group.id}>
          {index > 0 ? <CommandSeparator className="my-1" /> : null}
          <CommandGroup
            heading={
              <span className="flex items-center gap-2 text-foreground">
                <ProviderLogo className="size-4 text-muted-foreground" monochrome provider={group.id} />
                {group.name}
              </span>
            }
          >
            {group.options.map(({ benchmark, provider, tier }) => {
              const value = configurationKey({ provider, tier: tier.id, variant: benchmark.variant });
              const taken = occupied.has(value);
              const current =
                provider === selectedProvider &&
                tier.id === selectedTier &&
                benchmark.variant === selectedVariant;
              const compute = benchmark.vcpu == null ? "CPU not reported" : `${benchmark.vcpu} vCPU`;
              const memory = benchmark.ramGb == null ? "RAM not reported" : `${benchmark.ramGb} GiB`;
              const name = productName(provider);
              const variantLabel = isDiskVariant(benchmark.variant)
                ? diskVariantName(benchmark.variant)
                : null;

              return (
                <CommandItem
                  aria-label={`${group.name} ${name}, ${tier.label}${variantLabel ? `, ${variantLabel}` : ""}, ${compute}, ${memory}, ${formatMoney(benchmark.monthlyUsd)} per month${taken ? ", already compared" : current ? ", current configuration" : ""}`}
                  className="min-h-14 cursor-pointer gap-3 px-3 py-2 data-[disabled=true]:pointer-events-auto [&>svg:last-child]:hidden"
                  disabled={taken}
                  key={value}
                  keywords={[group.name, name, tier.label, variantLabel ?? "", compute, memory, benchmark.instanceType]}
                  onFocus={() => onPreview?.(provider, tier.id, benchmark.variant)}
                  onPointerEnter={() => onPreview?.(provider, tier.id, benchmark.variant)}
                  onSelect={() => { if (!taken) onSelect(provider, tier.id, benchmark.variant); }}
                  value={value}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[13px] font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground">
                      {[tier.label, variantLabel, compute, memory].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono text-[13px] tabular-nums">
                      {formatMoney(benchmark.monthlyUsd)}
                      <span className="font-sans text-[11px] text-muted-foreground">/mo</span>
                    </span>
                    {taken || current ? (
                      <span className="text-[11px] text-muted-foreground">
                        {taken ? "Already compared" : "Current"}
                      </span>
                    ) : null}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Fragment>
      ))}
    </>
  );
}
