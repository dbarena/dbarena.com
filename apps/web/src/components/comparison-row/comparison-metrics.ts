import type { BenchmarkSummary } from "@/lib/benchmarks";
import type { BoundType } from "@/lib/catalog";
import {
  formatBehindLead,
  formatInteger,
  formatMoney,
} from "@/lib/format";

export type TableColumn = {
  id: string;
  benchmark: BenchmarkSummary;
};

export type MetricKey =
  | "value"
  | "cost"
  | "throughput"
  | "latency"
  | "clients"
  | "hardware"
  | "disk"
  | "floor";

export type MetricRow = {
  id: MetricKey;
  label: string;
  hint: string;
  higherWins: boolean | null;
  showBehind: boolean;
  weight: "hero" | "metric" | "fact";
  value: (column: TableColumn) => number | null;
  display: (column: TableColumn) => string;
};

export function boundCopy(boundType: BoundType) {
  switch (boundType) {
    case "cache-fit":
      return {
        compact: "Fit",
        label: "Cache Fit",
        hint: "The data set fits in the buffer cache, so reads rarely touch disk.",
      };
    case "cache-exceeding":
      return {
        compact: "Exceeding",
        label: "Cache Exceeding",
        hint: "The data set is larger than RAM, so some reads need to be served from disk.",
      };
    default: {
      const exhaustive: never = boundType;
      return exhaustive;
    }
  }
}

function hardware(benchmark: BenchmarkSummary) {
  const instance =
    benchmark.instanceType !== "Not reported" ? benchmark.instanceType : null;
  const spec = [
    benchmark.vcpu == null ? null : `${benchmark.vcpu} vCPU`,
    benchmark.ramGb == null ? null : `${benchmark.ramGb} GiB`,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
  return [instance, spec].filter(Boolean).join(" · ");
}

function disk(benchmark: BenchmarkSummary) {
  return [
    benchmark.diskGb == null ? null : `${benchmark.diskGb} GB`,
    benchmark.iops == null ? null : `${formatInteger(benchmark.iops)} IOPS`,
    benchmark.throughputMbps == null
      ? null
      : `${formatInteger(benchmark.throughputMbps)} MB/s`,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

function boundRows(boundType: BoundType): MetricRow[] {
  switch (boundType) {
    case "cache-fit":
    case "cache-exceeding":
      return [
        {
          id: "disk",
          label: "Disk",
          hint: "Provisioned disk size, IOPS, and throughput.",
          higherWins: null,
          showBehind: false,
          weight: "fact",
          value: () => null,
          display: (column) => disk(column.benchmark) || "—",
        },
      ];
    default: {
      const exhaustive: never = boundType;
      return exhaustive;
    }
  }
}

export function metricRows(boundType: BoundType): MetricRow[] {
  return [
    {
      id: "value",
      label: "tpm/$",
      hint: "Transactions per minute for each dollar of monthly list price.",
      higherWins: true,
      showBehind: true,
      weight: "hero",
      value: (column) => column.benchmark.terminalThroughputPerDollar,
      display: (column) =>
        column.benchmark.terminalThroughputPerDollar == null
          ? "—"
          : formatInteger(column.benchmark.terminalThroughputPerDollar),
    },
    {
      id: "cost",
      label: "$/mo",
      hint: "On-demand list price per month.",
      higherWins: false,
      showBehind: true,
      weight: "metric",
      value: (column) => column.benchmark.monthlyUsd,
      display: (column) =>
        column.benchmark.monthlyUsd == null
          ? "—"
          : formatMoney(column.benchmark.monthlyUsd),
    },
    {
      id: "throughput",
      label: "tpm",
      hint: "Transactions finished per minute.",
      higherWins: true,
      showBehind: true,
      weight: "metric",
      value: (column) => column.benchmark.terminalThroughput,
      display: (column) => formatInteger(column.benchmark.terminalThroughput),
    },
    {
      id: "latency",
      label: "p95",
      hint: "19 of 20 transactions completed this fast or faster.",
      higherWins: false,
      showBehind: true,
      weight: "metric",
      value: (column) => column.benchmark.terminalP95LatencyMs,
      display: (column) =>
        `${formatInteger(column.benchmark.terminalP95LatencyMs)} ms`,
    },
    {
      id: "clients",
      label: "Clients",
      hint: "The number of clients (concurrency level) used to simulate the workload.",
      higherWins: null,
      showBehind: false,
      weight: "fact",
      value: (column) => column.benchmark.terminalConcurrency,
      display: (column) => String(column.benchmark.terminalConcurrency),
    },
    {
      id: "hardware",
      label: "Instance",
      hint: "The instance that was provisioned: type, vCPU, and RAM.",
      higherWins: null,
      showBehind: false,
      weight: "fact",
      value: () => null,
      display: (column) => hardware(column.benchmark) || "—",
    },
    ...boundRows(boundType),
  ];
}

export type RowLead = {
  kind: "best" | "tied" | "behind";
  bestValue: number;
  value: number;
};

export function leadForRow(
  row: MetricRow,
  columns: TableColumn[],
  column: TableColumn,
): RowLead | null {
  if (columns.length < 2) return null;
  const higherWins = row.higherWins;
  if (higherWins == null) return null;
  const ranked = columns
    .map((entry) => ({ id: entry.id, value: row.value(entry) }))
    .filter(
      (entry): entry is { id: string; value: number } => entry.value != null,
    )
    .sort((left, right) =>
      higherWins ? right.value - left.value : left.value - right.value,
    );
  const best = ranked[0];
  const current = row.value(column);
  if (ranked.length < 2 || !best || current == null) return null;
  if (current !== best.value) {
    return { kind: "behind", bestValue: best.value, value: current };
  }
  return {
    kind:
      ranked.filter((entry) => entry.value === best.value).length > 1
        ? "tied"
        : "best",
    bestValue: best.value,
    value: current,
  };
}

export function formatGap(row: MetricRow, value: number, bestValue: number) {
  switch (row.id) {
    case "latency":
      return value - bestValue < 1
        ? "<1 ms slower"
        : `${formatInteger(value - bestValue)} ms slower`;
    case "cost":
      return `${formatMoney(value - bestValue)} more`;
    case "floor": {
      if ((bestValue - value) * 100 < 1) return "<1 pt behind";
      const pts = Math.round((bestValue - value) * 100);
      return `${formatInteger(pts)} ${pts === 1 ? "pt" : "pts"} behind`;
    }
    case "value":
    case "throughput":
      if (bestValue > 0 && ((bestValue - value) / bestValue) * 100 < 0.1) {
        return "<0.1% behind";
      }
      return formatBehindLead(value, bestValue);
    case "clients":
    case "hardware":
    case "disk":
      return "—";
    default: {
      const exhaustive: never = row.id;
      return exhaustive;
    }
  }
}
