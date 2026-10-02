import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

import {
  isColumnTier,
  isProviderSlug,
  type BoundType,
  type ColumnProvider,
  type ColumnTier,
} from "@/lib/catalog";
import { peakMeasurement, type PeakMeasurement } from "@/lib/benchmarks-peak";
import {
  readNewOrderSeries,
  type NewOrderSample,
} from "@/lib/raw-clients";

export type { NewOrderSample };

type BenchmarkIndexEntry = {
  path: string;
  product: string | null;
  provider: string | null;
};

type BenchmarkResult = {
  provider: string;
  product: string | null;
  scenario: string;
  tier: string | null;
  bound_type: string;
  variant?: string | null;
  measured_to: string;
  instance?: {
    instance_type?: string | null;
    vcpu?: number | null;
    ram_gb?: number | null;
    disk_gb?: number | null;
    iops?: number | null;
    throughput_mbps?: number | null;
  };
  pricing: {
    monthly_usd: number;
  } | null;
  peak: PeakMeasurement;
};

export type BenchmarkSummary = {
  provider: ColumnProvider;
  host: string;
  scenario: string;
  tier: ColumnTier;
  boundType: BoundType;
  variant: string | null;
  path: string;
  instanceType: string;
  vcpu: number | null;
  ramGb: number | null;
  diskGb: number | null;
  iops: number | null;
  throughputMbps: number | null;
  measuredTo: string;
  monthlyUsd: number | null;
  // The terminal* fields hold the peak concurrency result (see PeakMeasurement).
  terminalConcurrency: number;
  terminalThroughput: number;
  terminalThroughputPerDollar: number | null;
  terminalP95LatencyMs: number;
  newOrderSeries: NewOrderSample[] | null;
  minVsMedian: number | null;
  /** Raw per-second row count behind the (possibly downsampled) series. */
  sampleCount: number | null;
};

const tierOrder = new Map(
  [
    "small",
    "medium",
    "large",
    "xlarge",
    "2xlarge",
    "4xlarge",
    "8xlarge",
  ].map((tier, index) => [tier, index]),
);

function mapBoundType(rawBoundType: string): BoundType | null {
  if (rawBoundType === "cache-fit") return "cache-fit";
  if (rawBoundType === "cache-exceeding") return "cache-exceeding";
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function slug(value: string | null) {
  return value && isProviderSlug(value) ? value : null;
}

function parseIndex(value: unknown): BenchmarkIndexEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const filePath = asString(entry.path);
    if (!filePath) return [];
    return [
      {
        path: filePath,
        product: asString(entry.product),
        provider: asString(entry.provider),
      },
    ];
  });
}

function parseResult(value: unknown): BenchmarkResult | null {
  if (!isRecord(value)) return null;
  const provider = asString(value.provider);
  const scenario = asString(value.scenario);
  const boundType = asString(value.bound_type);
  const measuredTo = asString(value.measured_to);
  if (!provider || !scenario || !boundType || !measuredTo) return null;
  const peak = peakMeasurement(value.sweep);
  if (!peak) return null;

  const instance = isRecord(value.instance) ? value.instance : null;
  const pricing = isRecord(value.pricing) ? value.pricing : null;

  return {
    provider,
    product: asString(value.product),
    scenario,
    tier: asString(value.tier),
    bound_type: boundType,
    variant: asString(value.variant),
    measured_to: measuredTo,
    instance: instance
      ? {
          instance_type: asString(instance.instance_type),
          vcpu: asNumber(instance.vcpu),
          ram_gb: asNumber(instance.ram_gb),
          disk_gb: asNumber(instance.disk_gb),
          iops: asNumber(instance.iops),
          throughput_mbps: asNumber(instance.throughput_mbps),
        }
      : undefined,
    pricing:
      pricing && asNumber(pricing.monthly_usd) != null
        ? { monthly_usd: asNumber(pricing.monthly_usd)! }
        : null,
    peak,
  };
}

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function loadBenchmarks(): Promise<BenchmarkSummary[]> {
  const resultsDirectory = path.resolve(process.cwd(), "../../results");
  const index = parseIndex(
    await readJson(path.join(resultsDirectory, "index.json")),
  );

  const loaded = await Promise.all(
    index.map(async (entry) => {
      const result = parseResult(
        await readJson(path.join(resultsDirectory, entry.path)),
      );
      if (!result) return null;
      const column =
        slug(entry.product) ??
        slug(result.product) ??
        slug(result.provider);
      if (!column) return null;
      const host = slug(entry.provider) ?? slug(result.provider) ?? column;
      if (!isColumnTier(result.tier)) return null;
      const boundType = mapBoundType(result.bound_type);
      if (!boundType) return null;

      const peak = result.peak;
      const series = await readNewOrderSeries(
        resultsDirectory,
        entry.path,
        peak.rawMetricsFile,
      );

      return {
        provider: column,
        host,
        scenario: result.scenario,
        tier: result.tier,
        boundType,
        variant: result.variant ?? null,
        path: entry.path,
        instanceType: result.instance?.instance_type ?? "Not reported",
        vcpu: result.instance?.vcpu ?? null,
        ramGb: result.instance?.ram_gb ?? null,
        diskGb: result.instance?.disk_gb ?? null,
        iops: result.instance?.iops ?? null,
        throughputMbps: result.instance?.throughput_mbps ?? null,
        measuredTo: result.measured_to,
        monthlyUsd: result.pricing?.monthly_usd ?? null,
        terminalConcurrency: peak.concurrency,
        terminalThroughput: peak.tpm,
        terminalThroughputPerDollar: peak.tpmPerDollar,
        terminalP95LatencyMs: peak.p95,
        newOrderSeries: series.samples,
        minVsMedian: series.minVsMedian,
        sampleCount: series.sampleCount,
      } satisfies BenchmarkSummary;
    }),
  );

  return loaded
    .filter((benchmark): benchmark is BenchmarkSummary => benchmark != null)
    .sort((a, b) => {
      const tierDifference =
        (tierOrder.get(a.tier) ?? Number.MAX_SAFE_INTEGER) -
        (tierOrder.get(b.tier) ?? Number.MAX_SAFE_INTEGER);
      return (
        tierDifference ||
        a.boundType.localeCompare(b.boundType) ||
        a.provider.localeCompare(b.provider) ||
        a.scenario.localeCompare(b.scenario)
      );
    });
}

let catalog: Promise<BenchmarkSummary[]> | null = null;

export const getBenchmarks = cache(async function getBenchmarks() {
  catalog ??= loadBenchmarks();
  return catalog;
});
