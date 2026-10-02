import "./source-loader.mjs";
import assert from "node:assert/strict";
import test from "node:test";

const { buildHomeData } = await import("../src/components/home/home-data.ts");
const { TIER_OPTIONS } = await import("../src/lib/catalog.ts");
const {
  priceLatencyRows,
  leaderRow,
  sizeView,
  sparklineCaption,
} = await import("../src/components/home/price-latency-model.ts");

function benchmark(provider, tier, value, extra = {}) {
  return {
    provider, host: provider, tier, boundType: "cache-fit", variant: null, scenario: "tpcc",
    path: `${provider}/${tier}.json`, instanceType: "test-instance", vcpu: 2, ramGb: 8,
    diskGb: 100, iops: null, throughputMbps: null, measuredTo: "2026-09-01T00:00:00Z",
    monthlyUsd: 50, terminalConcurrency: 20, terminalThroughput: value * 50,
    terminalThroughputPerDollar: value, terminalP95LatencyMs: 5, newOrderSeries: null,
    lowVsMedian: null, sampleCount: null, ...extra,
  };
}

const smallIndex = TIER_OPTIONS.findIndex((tier) => tier.id === "small");

test("$/mo on every published row equals row.monthlyUsd", () => {
  const data = buildHomeData([
    benchmark("alpha", "small", 100, { monthlyUsd: 25.66 }),
    benchmark("beta", "small", 80, { monthlyUsd: 41.5 }),
  ]);
  const rows = priceLatencyRows(data, smallIndex);
  const published = rows.filter((entry) => entry.published);
  assert.equal(published.length, 2);
  const view = sizeView(data, smallIndex);
  for (const entry of published) {
    const source = view.rows.find((row) => row.provider === entry.row.provider);
    assert.equal(entry.row.monthlyUsd, source.monthlyUsd);
  }
});

test("a product absent at the size renders a placeholder instead of disappearing", () => {
  const data = buildHomeData([
    benchmark("alpha", "small", 100),
    benchmark("alpha", "medium", 100),
    // Beta only has a result at medium, not small.
    benchmark("beta", "medium", 200),
  ]);
  const rows = priceLatencyRows(data, smallIndex);
  assert.equal(rows.length, 2);
  const missing = rows.find((entry) => !entry.published);
  assert.ok(missing, "expected a placeholder row for the product missing at this size");
  assert.equal(missing.name, "Beta");
  const present = rows.find((entry) => entry.published);
  assert.equal(present.row.provider, "alpha");
});

test("rows sort by tpm/$ descending, with unpriced and unpublished rows last", () => {
  const data = buildHomeData([
    benchmark("alpha", "small", 50),
    benchmark("beta", "small", 200),
    benchmark("gamma", "small", null, { monthlyUsd: null, terminalThroughputPerDollar: null }),
    // Delta never appears at small, so it becomes a placeholder row.
    benchmark("delta", "medium", 999),
  ]);
  const rows = priceLatencyRows(data, smallIndex);
  const order = rows.map((entry) => (entry.published ? entry.row.provider : entry.provider));
  assert.deepEqual(order.slice(0, 2), ["beta", "alpha"]);
  // The unpriced published row and the unpublished placeholder both sort
  // after every priced row.
  assert.deepEqual(new Set(order.slice(2)), new Set(["gamma", "delta"]));
});

test("the sparkline caption names the metric, the size and the product", () => {
  const data = buildHomeData([
    benchmark("alpha", "small", 100, {
      newOrderSeries: [{ tSeconds: 0, tpm: 10 }, { tSeconds: 30, tpm: 12 }, { tSeconds: 60, tpm: 11 }],
      sampleCount: 1800,
    }),
  ]);
  const rows = priceLatencyRows(data, smallIndex);
  const leader = leaderRow(rows);
  assert.ok(leader);
  assert.equal(sparklineCaption({ label: "Small", row: leader }), "transactions/min \u00b7 Small \u00b7 Alpha");
});

// The sample interval and the run length are set by the protocol, not by a
// row, and both have changed. Stating either here would date the caption.
test("the sparkline caption claims no sample interval and no run length", () => {
  const caption = sparklineCaption({ label: "Small", row: { name: "Alpha", sampleCount: 1800 } });
  assert.doesNotMatch(caption, /sample/i);
  assert.doesNotMatch(caption, /second/i);
  assert.doesNotMatch(caption, /\d+\s*min run/);
});

test("the sparkline caption says so when a size has no published samples", () => {
  assert.match(sparklineCaption({ label: "Small", row: null }), /No samples published/);
});

test("leaderRow follows the tpm/\\$ ranking, not catalog order", () => {
  const data = buildHomeData([
    benchmark("alpha", "small", 50),
    benchmark("beta", "small", 200),
  ]);
  const rows = priceLatencyRows(data, smallIndex);
  const leader = leaderRow(rows);
  assert.equal(leader.provider, "beta");
});
