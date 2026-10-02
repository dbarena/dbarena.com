import "./source-loader.mjs";
import assert from "node:assert/strict";
import test from "node:test";

const { peakMeasurement } = await import("../src/lib/benchmarks-peak.ts");

// One run's measurement at one concurrency level, as dbarenactl writes it.
function iteration(number, tpm, median, extra = {}) {
  return {
    iteration: number,
    median,
    tpm_per_dollar_month: tpm / 100,
    workload_metrics: { transactions: { NEW_ORDER: { tpm, latency_ms: { p95: tpm / 1000 } } } },
    raw_metrics_file: `raw-${tpm}.csv`,
    ...extra,
  };
}

// RDS cache-exceeding-xlarge: the runs peak at different client counts, and
// the median is highest at 16 clients (the methodology's worked example).
function sweep() {
  return [
    { concurrency: 4, peak: false, iterations: [iteration(1, 9302, false), iteration(2, 9395, true), iteration(3, 10948, false)] },
    { concurrency: 8, peak: false, iterations: [iteration(1, 15529, true), iteration(2, 14846, false), iteration(3, 16300, false)] },
    { concurrency: 16, peak: true, iterations: [iteration(1, 18085, false), iteration(2, 16200, true), iteration(3, 11852, false)] },
    { concurrency: 24, peak: false, iterations: [iteration(1, 7647, true), iteration(2, 7228, false), iteration(3, 8079, false)] },
  ];
}

test("picks the median run of the peak entry, not the last entry or the first run", () => {
  assert.deepEqual(peakMeasurement(sweep()), {
    concurrency: 16,
    tpm: 16200,
    p95: 16.2,
    tpmPerDollar: 162,
    rawMetricsFile: "raw-16200.csv",
  });
});

test("keeps a missing price as null", () => {
  const points = sweep();
  points[2].iterations[1].tpm_per_dollar_month = null;
  assert.equal(peakMeasurement(points)?.tpmPerDollar, null);
});

test("rejects a sweep without exactly one peak", () => {
  const none = sweep().map((point) => ({ ...point, peak: false }));
  assert.equal(peakMeasurement(none), null);
  const two = sweep();
  two[0].peak = true;
  assert.equal(peakMeasurement(two), null);
});

test("rejects a peak entry without exactly one median run", () => {
  const none = sweep();
  none[2].iterations[1].median = false;
  assert.equal(peakMeasurement(none), null);
  const two = sweep();
  two[2].iterations[0].median = true;
  assert.equal(peakMeasurement(two), null);
});

test("rejects a median run without workload metrics", () => {
  const points = sweep();
  points[2].iterations[1].workload_metrics = { transactions: {} };
  assert.equal(peakMeasurement(points), null);
});
