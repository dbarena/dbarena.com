import "./source-loader.mjs";
import assert from "node:assert/strict";
import test from "node:test";

const { buildHomeData } = await import("../src/components/home/home-data.ts");
const { PROVIDER_NAMES } = await import("../src/lib/catalog.ts");
const { faqDateRange, cadenceAnswer } = await import("../src/components/home/faq-dates.ts");
const { PROTOCOL_LINES, NOT_MEASURED, SIZE_PATH_BLURBS } = await import("../src/components/home/home-copy.ts");

function benchmark(provider, tier, measuredTo) {
  return {
    provider, host: provider, tier, boundType: "cache-fit", variant: null, scenario: "tpcc",
    path: `${provider}/${tier}.json`, instanceType: "test-instance", vcpu: 2, ramGb: 8,
    diskGb: 100, iops: null, throughputMbps: null, measuredTo,
    monthlyUsd: 50, terminalConcurrency: 20, terminalThroughput: 100 * 50,
    terminalThroughputPerDollar: 100, terminalP95LatencyMs: 5, newOrderSeries: null,
    lowVsMedian: null, sampleCount: null,
  };
}

test("faqDateRange returns the min and max measuredTo across the catalog", () => {
  const data = buildHomeData([
    benchmark("alpha", "small", "2026-08-21T00:00:00Z"),
    benchmark("alpha", "medium", "2026-09-01T00:00:00Z"),
    benchmark("beta", "small", "2026-09-12T00:00:00Z"),
  ]);
  const range = faqDateRange(data);
  assert.equal(range.earliest, "2026-08-21T00:00:00Z");
  assert.equal(range.latest, "2026-09-12T00:00:00Z");
});

test("faqDateRange collapses to one date when every result shares it", () => {
  const data = buildHomeData([
    benchmark("alpha", "small", "2026-09-05T00:00:00Z"),
    benchmark("beta", "small", "2026-09-05T00:00:00Z"),
  ]);
  const range = faqDateRange(data);
  assert.equal(range.earliest, range.latest);

  const answer = cadenceAnswer(range);
  assert.match(answer, /The most recent results shown here are from/);
  assert.doesNotMatch(answer, /gathered between/);
});

test("cadenceAnswer states both dates when they differ", () => {
  const answer = cadenceAnswer({ earliest: "2026-08-21T00:00:00Z", latest: "2026-09-12T00:00:00Z" });
  assert.match(answer, /The results shown here have been gathered between/);
  assert.match(answer, /We do not run these benchmarks on a fixed cadence\./);
});

test("PROTOCOL_LINES has four entries, each linking to a methodology anchor", () => {
  assert.equal(PROTOCOL_LINES.length, 4);
  for (const line of PROTOCOL_LINES) {
    assert.match(line.href, /^\/methodology#[a-z]+$/);
    assert.ok(line.text.length > 10, `"${line.label}" needs real prose`);
  }
  // Each of the four rules the plan names a home for.
  const anchors = PROTOCOL_LINES.map((line) => line.href);
  assert.deepEqual(anchors, [
    "/methodology#candidates",
    "/methodology#workloads",
    "/methodology#execution",
    "/methodology#metrics",
  ]);
});

test("NOT_MEASURED names no product", () => {
  const slugs = Object.keys(PROVIDER_NAMES);
  const names = Object.values(PROVIDER_NAMES);
  for (const needle of [...slugs, ...names]) {
    assert.ok(
      !new RegExp(`\\b${needle}\\b`, "i").test(NOT_MEASURED),
      `NOT_MEASURED names the product "${needle}"`,
    );
  }
  assert.ok(NOT_MEASURED.length > 100, "NOT_MEASURED should be a real paragraph");
});

test("SIZE_PATH_BLURBS covers every cache-fit chapter", () => {
  assert.deepEqual(Object.keys(SIZE_PATH_BLURBS).sort(), ["heavy", "production", "side-project"]);
  for (const blurb of Object.values(SIZE_PATH_BLURBS)) {
    assert.ok(blurb.length > 20, "size-path blurbs need a real sentence");
  }
});
