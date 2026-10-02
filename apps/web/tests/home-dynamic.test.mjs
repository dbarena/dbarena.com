import "./source-loader.mjs";
import assert from "node:assert/strict";
import test from "node:test";

const { buildHomeData } = await import("../src/components/home/home-data.ts");
const { rankOverview, rankPaint } = await import("../src/components/home/home-evidence.ts");
const { IO_CHAPTER } = await import("../src/components/home/home-copy.ts");
const { TIER_OPTIONS } = await import("../src/lib/catalog.ts");
const { overallStandings } = await import("../src/components/home/hero/rank-standing.ts");

function benchmark(provider, tier, value, extra = {}) {
  return { provider, host: provider, tier, boundType: "cache-fit", variant: null, scenario: "tpcc",
    path: `${provider}/${tier}.json`, instanceType: "test", vcpu: 2, ramGb: 8,
    diskGb: 100, iops: null, throughputMbps: null, measuredTo: "2026-09-01T00:00:00Z",
    monthlyUsd: 50, terminalConcurrency: 20, terminalThroughput: value * 50,
    terminalThroughputPerDollar: value, terminalP95LatencyMs: 5, newOrderSeries: null,
    lowVsMedian: null, sampleCount: null, ...extra };
}
const full = (provider, values, boundType = "cache-fit") => TIER_OPTIONS.map((tier, i) => benchmark(provider, tier.id, values[i], { boundType }));

test("new products and changed winners propagate through the whole homepage model", () => {
  const inputs = Array.from({ length: 7 }, (_, n) => full(`new-product-${n+1}`, TIER_OPTIONS.map(() => 100 + n * 10))).flat();
  const data = buildHomeData(inputs);
  assert.equal(data.stats.providers, 7);
  assert.equal(data.crossTier.lines.length, 7);
  assert.equal(data.hero.rows[0].name, "New Product 7");
  assert.equal(data.chapters[0].verdict, "New Product 7 wins on tpm/$ at Small and Medium.");
  assert.match(data.hero.rows[0].compareHref, /new-product-7/);
  const changed = buildHomeData(inputs.map(row => row.provider === "new-product-1" ? { ...row, terminalThroughputPerDollar: 1000 } : row));
  assert.equal(overallStandings(changed.crossTier.lines)[0].line.provider, "new-product-1");
  assert.equal(changed.chapters[0].verdict, "New Product 1 wins on tpm/$ at Small and Medium.");
  assert.equal(new Set(Array.from({ length: 7 }, (_, i) => JSON.stringify(rankPaint(i)))).size, 7);
});

test("hero ranking uses cache-exceeding results and its selected rows match", () => {
  const data = buildHomeData([
    benchmark("alpha", "large", 300),
    benchmark("beta", "large", 100),
    benchmark("alpha", "large", 100, { boundType: "cache-exceeding" }),
    benchmark("beta", "large", 300, { boundType: "cache-exceeding" }),
  ]);
  const index = data.rankTier.tiers.findIndex((tier) => tier.tier === "large");
  assert.equal(data.crossTier.lines.find((line) => line.provider === "alpha")?.points[index]?.rank, 1);
  assert.equal(data.rankTier.lines.find((line) => line.provider === "beta")?.points[index]?.rank, 1);
  assert.equal(data.io.tierViews.find((view) => view.tier === "large")?.rows[0]?.provider, "beta");
  assert.match(data.io.tierViews.find((view) => view.tier === "large")?.rows[0]?.compareHref ?? "", /bound=cache-exceeding/);
});

test("hero describes every lead change, not just the first two products", () => {
  const data = buildHomeData([
    ...full("alpha", [300,300,100,100,100,100,400]),
    ...full("beta", [200,200,300,300,100,100,200]),
    ...full("gamma", [100,100,200,200,300,300,100]),
  ]);
  const copy = rankOverview(data.crossTier);
  assert.equal(copy.emphasis, "Large.");
  assert.equal(copy.body, "Alpha wins on tpm/$ at Small–Medium, Beta at Large–XLarge, Gamma at 2XLarge–4XLarge, Alpha at 8XLarge.");
  assert.equal(data.chapters[1].verdict, "Beta wins on tpm/$ at Large–XLarge, Gamma at 2XLarge.");
});

test("missing results and prices do not become winners or full-range claims", () => {
  const data = buildHomeData([benchmark("alpha", "small", 100), benchmark("alpha", "large", 100), benchmark("unpriced", "medium", null)]);
  const copy = rankOverview(data.crossTier);
  assert.equal(copy.body, "Alpha wins on tpm/$ at Small, Alpha at Large.");
  assert.doesNotMatch(copy.body, /Small–Large|Unpriced leads/);
  assert.match(data.chapters[0].verdict, /size by size/);
  assert.doesNotMatch(data.chapters[0].verdict, /both|every/);
  assert.equal(data.crossTier.lines.find(l => l.provider === "unpriced").points[1].rank, null);
  assert.match(rankOverview(buildHomeData([]).crossTier).body, /No priced/);
});

test("tied results are shared instead of picking a provider by ordering", () => {
  const data = buildHomeData([benchmark("alpha", "small", 100), benchmark("beta", "small", 100)]);
  assert.deepEqual(data.hero.rows.map(r => r.rank), [1,1]);
  assert.equal(rankOverview(data.crossTier).body, "Alpha and Beta win on tpm/$ at Small.");
  assert.match(data.chapters[0].body, /share first place/);
});

test("home ranks cost optimized and pairs the performance figure from 2XLarge", () => {
  const data = buildHomeData([
    benchmark("alpha", "small", 100),
    benchmark("alpha", "2xlarge", 80, { variant: "cost-optimized" }),
    benchmark("alpha", "2xlarge", 200, { variant: "performance-optimized", terminalThroughput: 400 }),
    benchmark("beta", "2xlarge", 90, { variant: "cost-optimized" }),
  ]);
  const view = data.chapters.find((chapter) => chapter.id === "production")
    ?.tierViews.find((entry) => entry.tier === "2xlarge");
  const alpha = view?.rows.find((row) => row.provider === "alpha");
  const beta = view?.rows.find((row) => row.provider === "beta");
  const point = data.crossTier.lines.find((line) => line.provider === "alpha")
    ?.points.find((entry) => entry.tier === "2xlarge");

  assert.equal(view?.hasOptimizationPair, true);
  assert.equal(alpha?.perDollar, 80);
  assert.equal(alpha?.rank, 2);
  assert.equal(beta?.rank, 1);
  assert.equal(beta?.pair, undefined);
  assert.equal(alpha?.pair?.primary.perDollar, 80);
  assert.equal(alpha?.pair?.secondary.perDollar, 200);
  assert.equal(alpha?.pair?.primary.tpm, 80 * 50);
  assert.equal(alpha?.pair?.secondary.tpm, 400);
  assert.equal(alpha?.pair?.primary.name, "Cost optimized");
  assert.equal(alpha?.pair?.primary.shortName, "Cost");
  assert.equal(alpha?.pair?.secondary.name, "Performance optimized");
  assert.equal(alpha?.pair?.secondary.shortName, "Performance");
  assert.match(alpha?.pair?.primary.compareHref ?? "", /cost-optimized/);
  assert.match(alpha?.pair?.secondary.compareHref ?? "", /performance-optimized/);
  assert.equal(point?.perDollar, 80);
  assert.equal(point?.performancePerDollar, 200);
  assert.equal(point?.rank, 2);
  assert.equal(point?.performanceRank, 1);
  assert.equal(data.chapters[0]?.tierViews[0]?.hasOptimizationPair, false);
});

test("switching I/O setup uses the performance figure and re-ranks that size", async () => {
  const { standingFor, valueLeaders } = await import("../src/components/home/optimization-pair.ts");
  const data = buildHomeData([
    benchmark("alpha", "2xlarge", 80, { variant: "cost-optimized" }),
    benchmark("alpha", "2xlarge", 200, { variant: "performance-optimized", terminalThroughput: 400 }),
    benchmark("beta", "2xlarge", 90, { variant: "cost-optimized" }),
  ]);
  const view = data.chapters.find((entry) => entry.id === "production")
    ?.tierViews.find((entry) => entry.tier === "2xlarge");
  const alpha = view?.rows.find((row) => row.provider === "alpha");
  const beta = view?.rows.find((row) => row.provider === "beta");

  assert.deepEqual([...valueLeaders(view.rows, "cost-optimized")], ["beta"]);
  assert.deepEqual([...valueLeaders(view.rows, "performance-optimized")], ["alpha"]);
  assert.equal(standingFor(alpha, "cost-optimized").perDollar, 80);
  assert.equal(standingFor(alpha, "performance-optimized").perDollar, 200);
  assert.equal(standingFor(alpha, "performance-optimized").tpm, 400);
  assert.equal(standingFor(beta, "performance-optimized").perDollar, 90);
  assert.match(standingFor(alpha, "performance-optimized").compareHref, /alpha:2xlarge:performance-optimized/);
});

test("I/O plateau puts the protocol in the body and a finding in the verdict", () => {
  const data = buildHomeData(full("new-engine", [100,100,100,20,30,40,50], "cache-exceeding"));
  assert.equal(data.io.body, IO_CHAPTER.protocol);
  assert.equal(data.io.verdict, "Peak throughput barely moves across this range.");
  const gap = buildHomeData(full("new-engine", [100,100,100,20,30,40,50], "cache-exceeding").filter(row => row.tier !== "medium"));
  assert.notEqual(gap.io.verdict, IO_CHAPTER.protocol);
});

test("the blowout rival is second place, never the product that opened the range", async () => {
  const { factorLabel } = await import("../src/components/home/home-narrative-text.ts");
  // Alpha opens the range (leads at Small) but has fallen to 4th place by
  // 8XLarge. The true runner-up there is Gamma, not Alpha: the blowout
  // factor must be measured against Gamma, not against the opening product.
  const data = buildHomeData([
    benchmark("alpha", "small", 400),
    benchmark("beta", "small", 100),
    benchmark("gamma", "small", 100),
    benchmark("delta", "small", 100),
    // The heavy chapter spans 4XLarge and 8XLarge; both need a published
    // result at every product or the chapter falls back to a generic
    // per-size verdict instead of exercising detectStory's blowout branch.
    benchmark("alpha", "4xlarge", 100),
    benchmark("beta", "4xlarge", 300),
    benchmark("gamma", "4xlarge", 400),
    benchmark("delta", "4xlarge", 1000),
    benchmark("alpha", "8xlarge", 100),
    benchmark("beta", "8xlarge", 300),
    benchmark("gamma", "8xlarge", 400),
    benchmark("delta", "8xlarge", 1000),
  ]);
  const heavy = data.chapters.find((chapter) => chapter.id === "heavy");
  const size = heavy.tierViews.find((view) => view.tier === "8xlarge");
  const rows = size.rows;
  assert.equal(rows[0].name, "Delta");
  assert.equal(rows[1].name, "Gamma");
  assert.equal(rows[3].name, "Alpha");

  const expectedFactor = rows[0].tpm / rows[1].tpm;
  assert.equal(expectedFactor, 2.5);
  assert.match(heavy.verdict, new RegExp(`differs by ${factorLabel(expectedFactor)}\\u00d7`));
  // The buggy factor (leader vs. the opening product, 4th place) would be 10;
  // make sure that number never appears in the verdict.
  assert.doesNotMatch(heavy.verdict, /differs by 10\.0/);
});
