"use client";

import { useMemo } from "react";
import type { BenchmarkSummary } from "@/lib/benchmarks";
import {
  configurationKey,
  formatBoundType,
  indexCatalog,
  isColumnTier,
  lookupBenchmark,
  TIER_OPTIONS,
  type BoundType,
  type ColumnProvider,
  type ColumnTier,
} from "@/lib/catalog";
import { comparisonProviders, hostName, productName, productSummary } from "@/lib/comparison-providers";
import {
  diskVariantName,
  diskVariantResults,
  diskVariantSummary,
  isDiskVariant,
} from "@/lib/comparison-variants";
import { formatMoney } from "@/lib/format";
import { ColumnSelect, type ColumnSelectOption } from "./column-select";

function priceLabel(benchmark: BenchmarkSummary | undefined) {
  if (!benchmark) return undefined;
  return benchmark.monthlyUsd == null ? "Price not reported" : `${formatMoney(benchmark.monthlyUsd)}/mo`;
}

export function ColumnFilters({
  benchmarks,
  boundType,
  columnNumber,
  host,
  occupied,
  onSelectConfiguration,
  provider,
  tier,
  variant,
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
  const catalog = useMemo(() => indexCatalog(benchmarks), [benchmarks]);
  const products = useMemo(
    () => comparisonProviders(benchmarks).find((group) => group.id === host)?.products ?? [],
    [benchmarks, host],
  );
  const diskVariants = useMemo(
    () => diskVariantResults(catalog.values(), provider, tier, boundType),
    [boundType, catalog, provider, tier],
  );
  const tierLabel = TIER_OPTIONS.find((option) => option.id === tier)?.label;
  const loadLabel = formatBoundType(boundType);
  const productOptions: ColumnSelectOption[] = products.map((product) => {
    const benchmark = lookupBenchmark(catalog, product, tier, boundType, variant);
    return {
      value: product,
      label: productName(product),
      description: productSummary(product),
      price: priceLabel(benchmark),
      disabledReason: !benchmark
        ? "Not measured at this size and scenario"
        : occupied.has(configurationKey({ provider: product, tier, variant: benchmark.variant }))
          ? "Already compared at this size"
          : undefined,
    };
  });
  const sizeOptions: ColumnSelectOption[] = TIER_OPTIONS.map((option) => {
    const benchmark = lookupBenchmark(catalog, provider, option.id, boundType, variant);
    return {
      value: option.id,
      label: option.label,
      description: benchmark ? `${benchmark.vcpu ?? "—"} vCPU · ${benchmark.ramGb ?? "—"} GiB RAM` : undefined,
      price: priceLabel(benchmark),
      disabledReason: !benchmark
        ? "Not measured for this scenario"
        : occupied.has(configurationKey({ provider, tier: option.id, variant: benchmark.variant }))
          ? "Already in your comparison"
          : undefined,
    };
  });
  const optimizationOptions: ColumnSelectOption[] = [];
  for (const benchmark of diskVariants) {
    const option = benchmark.variant;
    if (!isDiskVariant(option)) continue;
    optimizationOptions.push({
      value: option,
      label: diskVariantName(option),
      description: diskVariantSummary(option),
      price: priceLabel(benchmark),
      disabledReason: occupied.has(configurationKey({ provider, tier, variant: option }))
        ? "Already in your comparison"
        : undefined,
    });
  }
  const currentOptimization = isDiskVariant(variant) ? diskVariantName(variant) : null;

  return (
    <div className="-ml-1.5 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5">
      {products.length > 1 ? (
        <ColumnSelect
          context={`${hostName(host)} · ${tierLabel} · ${loadLabel}`}
          label={`Comparison ${columnNumber} product`}
          onValueChange={(product) => onSelectConfiguration(product, tier, variant)}
          options={productOptions}
          title="Product"
          value={provider}
        />
      ) : (
        <span className="inline-flex min-h-9 items-center px-1.5 text-[12px] text-muted-foreground md:min-h-7">{productName(provider)}</span>
      )}
      <ColumnSelect
        context={`${productName(provider)} · ${loadLabel}`}
        label={`Comparison ${columnNumber} size`}
        onValueChange={(size) => { if (isColumnTier(size)) onSelectConfiguration(provider, size, variant); }}
        options={sizeOptions}
        title="Compute size"
        value={tier}
      />
      {optimizationOptions.length > 1 ? (
        <ColumnSelect
          context={`${productName(provider)} · ${tierLabel} · ${loadLabel}`}
          label={`Comparison ${columnNumber} optimization`}
          onValueChange={(next) => onSelectConfiguration(provider, tier, next)}
          options={optimizationOptions}
          title="Optimization"
          value={variant ?? ""}
        />
      ) : currentOptimization ? (
        <span className="inline-flex min-h-9 items-center px-1.5 text-[12px] text-muted-foreground md:min-h-7">{currentOptimization}</span>
      ) : null}
    </div>
  );
}
