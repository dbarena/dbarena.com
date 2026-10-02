/** The median run at a result's peak concurrency: the figures every view shows. */
export type PeakMeasurement = {
  concurrency: number;
  tpm: number;
  p95: number;
  tpmPerDollar: number | null;
  rawMetricsFile: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Finds the sweep entry marked `peak` and, in it, the iteration marked
 * `median`, and reads that iteration's figures. Returns null unless there is
 * exactly one of each and the figures are present.
 */
export function peakMeasurement(sweep: unknown): PeakMeasurement | null {
  if (!Array.isArray(sweep)) return null;
  const peaks = sweep.filter((point) => isRecord(point) && point.peak === true);
  if (peaks.length !== 1) return null;
  const peak = peaks[0];
  if (!Array.isArray(peak.iterations)) return null;

  const medians = peak.iterations.filter(
    (iteration: unknown) => isRecord(iteration) && iteration.median === true,
  );
  if (medians.length !== 1) return null;
  const median = medians[0];

  const workloadMetrics = isRecord(median.workload_metrics) ? median.workload_metrics : null;
  const transactions = isRecord(workloadMetrics?.transactions) ? workloadMetrics.transactions : null;
  const newOrder = isRecord(transactions?.NEW_ORDER) ? transactions.NEW_ORDER : null;
  const latency = isRecord(newOrder?.latency_ms) ? newOrder.latency_ms : null;

  const concurrency = asNumber(peak.concurrency);
  const tpm = asNumber(newOrder?.tpm);
  const p95 = asNumber(latency?.p95);
  if (concurrency == null || tpm == null || p95 == null) return null;

  return {
    concurrency,
    tpm,
    p95,
    tpmPerDollar: asNumber(median.tpm_per_dollar_month),
    rawMetricsFile: asString(median.raw_metrics_file),
  };
}
