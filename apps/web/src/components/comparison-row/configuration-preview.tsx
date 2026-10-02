import { ProviderLogo } from "@/components/provider-logo";
import type { BenchmarkSummary } from "@/lib/benchmarks";
import { formatBoundType, TIER_OPTIONS } from "@/lib/catalog";
import { hostName, productName, productSummary } from "@/lib/comparison-providers";
import { diskVariantName, diskVariantSummary, isDiskVariant } from "@/lib/comparison-variants";
import { formatInteger, formatMoney } from "@/lib/format";

export function ConfigurationPreview({ benchmark, taken }: {
  benchmark: BenchmarkSummary | null;
  taken: boolean;
}) {
  if (!benchmark) return <p className="px-4 py-3 text-xs leading-relaxed text-muted-foreground">Search for a result to see its configuration.</p>;

  const size = TIER_OPTIONS.find((tier) => tier.id === benchmark.tier)?.label;
  const variantLabel = isDiskVariant(benchmark.variant)
    ? diskVariantName(benchmark.variant)
    : null;
  const description = isDiskVariant(benchmark.variant)
    ? diskVariantSummary(benchmark.variant)
    : productSummary(benchmark.provider);
  const metrics = [
    ["Throughput", `${formatInteger(benchmark.terminalThroughput)} tpm`],
    ["p95 latency", `${formatInteger(benchmark.terminalP95LatencyMs)} ms`],
    ["Value", benchmark.terminalThroughputPerDollar == null ? "—" : `${formatInteger(benchmark.terminalThroughputPerDollar)} tpm/$`],
  ];

  return (
    <section aria-label="Configuration preview" className="px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ProviderLogo className="size-4 text-muted-foreground" monochrome provider={benchmark.host} />
        {hostName(benchmark.host)}
      </div>
      <h3 className="mt-1.5 text-[15px] font-medium leading-5">{productName(benchmark.provider)}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{[size, variantLabel, `${benchmark.vcpu ?? "—"} vCPU`, `${benchmark.ramGb ?? "—"} GiB`].filter(Boolean).join(" · ")}</p>
      <p className="mt-1.5 text-xs leading-[1.45] text-muted-foreground">{description}</p>

      <div className="mt-3 flex items-baseline gap-1 border-b border-border/70 pb-3">
        <span className="font-mono text-[22px] font-medium leading-7 tracking-tight tabular-nums">{formatMoney(benchmark.monthlyUsd)}</span>
        <span className="text-xs text-muted-foreground">/ month</span>
      </div>

      <dl className="mt-3 space-y-2.5 text-xs">
        <div className="space-y-0.5">
          <dt className="text-muted-foreground">Instance</dt>
          <dd className="break-words font-mono leading-4">{benchmark.instanceType}</dd>
        </div>
        {benchmark.iops != null || benchmark.diskGb != null ? (
          <div className="space-y-0.5">
            <dt className="text-muted-foreground">Disk</dt>
            <dd className="font-mono leading-4">{benchmark.diskGb ?? "—"} GB · {benchmark.iops == null ? "—" : formatInteger(benchmark.iops)} IOPS{benchmark.throughputMbps == null ? "" : ` · ${formatInteger(benchmark.throughputMbps)} MiB/s`}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-3 border-t border-border/70 pt-3">
        <h4 className="text-xs font-medium">{formatBoundType(benchmark.boundType)} benchmark <span className="font-normal text-muted-foreground">· {benchmark.terminalConcurrency} clients</span></h4>
        <dl className="mt-2 space-y-2 text-xs">
          {metrics.map(([label, value]) => (
            <div className="flex items-baseline justify-between gap-3" key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-mono tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-3 min-h-4 text-[11px] text-muted-foreground">{taken ? "Already in your comparison" : ""}</p>
    </section>
  );
}
