import "./source-loader.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { overallStandings, standingsAtSize } from "../src/components/home/hero/rank-standing.ts";
import { rankColumnCss, rankColumnX, rankLabelInset, rankPlotRight, rankPlotX } from "../src/components/home/hero/rank-chart-layout.ts";
import { diskLeader, diskStandingAt } from "../src/components/home/io-standing.ts";
// Dynamic imports (not static): these two modules pull in `@/lib/...`
// aliased imports at runtime, which only resolve once `source-loader.mjs`'s
// hook has actually run — static imports are all linked before any module
// body (including the loader's `registerHooks()` call) executes.
const { rankPaint } = await import("../src/components/home/home-evidence.ts");
const { earliestMeasuredTo, latestMeasuredTo } = await import("../src/lib/leaderboard.ts");

const line = (name, ranks) => ({
  name, provider: name,
  points: ranks.map((rank, tier) => ({ tier, rank, perDollar: rank === null ? null : 100 })),
});

test("current standings share third place without penalizing missing coverage", () => {
  const lines = [line("OrioleDB", [3,3,1,1,1,1,1]), line("Amazon RDS", [1,1,2,3,4,3,3]),
    line("Google Cloud SQL", [null,2,4,4,3,2,2]), line("Supabase", [2,4,3,2,2,4,4])];
  assert.deepEqual(overallStandings(lines).map(({ place, tied, wins, measured }) =>
    ({ place, tied, wins, measured })), [
    { place: 1, tied: false, wins: 5, measured: 7 },
    { place: 2, tied: false, wins: 2, measured: 7 },
    { place: 3, tied: true, wins: 0, measured: 6 },
    { place: 3, tied: true, wins: 0, measured: 7 },
  ]);
});

test("finishes are compared first, then second, then third", () => {
  const rows = [line("third", [3,3,3]), line("second", [2]), line("first", [1])];
  assert.deepEqual(overallStandings(rows).map(s => s.line.name), ["first", "second", "third"]);
  assert.deepEqual(rows.map(l => l.name), ["third", "second", "first"]);
  assert.equal(overallStandings([line("A", [2,3]), line("B", [2,4])])[0].line.name, "A");
});

test("tied positions skip the following place and ignore fourth-place counts", () => {
  const result = overallStandings([line("B", [1,4]), line("A", [1,null]), line("C", [2,3])]);
  assert.deepEqual(result.map(s => [s.line.name, s.place, s.tied]),
    [["A", 1, true], ["B", 1, true], ["C", 3, false]]);
});

test("unmeasured values cannot earn a finish", () => {
  const missing = line("missing", [1]);
  missing.points[0].perDollar = null;
  const result = overallStandings([missing, line("measured", [2])]);
  assert.equal(result[0].line.name, "measured");
  assert.equal(result[1].measured, 0);
  assert.equal(result[1].wins, 0);
  assert.deepEqual(overallStandings([]), []);
});

test("size standings list first place at that size before overall leaders", () => {
  const standings = overallStandings([
    line("OrioleDB", [3, 3, 1, 1, 1, 1, 1]),
    line("Amazon RDS", [1, 1, 2, 3, 4, 3, 3]),
    line("Google Cloud SQL", [null, 2, 4, 4, 3, 2, 2]),
    line("Supabase", [2, 4, 3, 2, 2, 4, 4]),
  ]);
  assert.deepEqual(standings.map(s => s.line.name), ["OrioleDB", "Amazon RDS", "Google Cloud SQL", "Supabase"]);
  assert.deepEqual(standingsAtSize(standings, 0).map(s => s.line.name),
    ["Amazon RDS", "Supabase", "OrioleDB", "Google Cloud SQL"]);
  assert.deepEqual(standingsAtSize(standings, 2).map(s => s.line.name),
    ["OrioleDB", "Amazon RDS", "Supabase", "Google Cloud SQL"]);
});

test("equal ranks at a size prefer higher value", () => {
  const low = line("A", [1]);
  low.points[0].perDollar = 50;
  const high = line("Z", [1]);
  high.points[0].perDollar = 80;
  const standings = overallStandings([low, high]);
  assert.deepEqual(standings.map(s => s.line.name), ["A", "Z"]);
  assert.deepEqual(standingsAtSize(standings, 0).map(s => s.line.name), ["Z", "A"]);
});

const diskRow = (provider, perDollar, monthlyUsd, tpm = perDollar == null ? 0 : perDollar * 10) => ({
  provider, name: provider, perDollar, monthlyUsd, tpm, compareHref: `/compare/${provider}`,
});

const diskTier = (tier, label, rows) => ({ tier, label, situation: label, rows });

test("the disk-bound standing at a selected size ranks by tpm/$, shares positions for ties, and sorts unpriced last", () => {
  const small = diskTier("small", "Small", [
    diskRow("Alpha", 300, 60),
    diskRow("Beta", 300, 50),
    diskRow("Gamma", null, 40),
    diskRow("Delta", 150, 45),
  ]);
  const standing = diskStandingAt([small], "small");
  assert.deepEqual(standing.map((entry) => entry.provider), ["Alpha", "Beta", "Delta", "Gamma"]);
  // Alpha and Beta share first place, so Delta's place skips second (matches
  // the shared-position convention `overallStandings` already uses).
  assert.deepEqual(standing.map((entry) => entry.rank), [1, 1, 3, null]);
  assert.equal(standing.every((entry) => entry.measured), true);
});

test("a product missing at a size gets a no-result placeholder instead of a shorter list", () => {
  const small = diskTier("small", "Small", [diskRow("Alpha", 300, 60), diskRow("Beta", 200, 50)]);
  const medium = diskTier("medium", "Medium", [
    diskRow("Alpha", 150, 90),
    diskRow("Beta", 140, 80),
    diskRow("Gamma", 120, 70),
  ]);
  const standing = diskStandingAt([small, medium], "small");
  assert.equal(standing.length, 3);
  const gamma = standing.find((entry) => entry.provider === "Gamma");
  assert.equal(gamma.measured, false);
  assert.equal(gamma.rank, null);
  assert.equal(gamma.perDollar, null);
  assert.equal(gamma.compareHref, null);
});

test("the disk-bound row's $/mo is the row's monthlyUsd", () => {
  const small = diskTier("small", "Small", [diskRow("Alpha", 300, 61.5), diskRow("Beta", 200, 50)]);
  const standing = diskStandingAt([small], "small");
  assert.equal(standing.find((entry) => entry.provider === "Alpha").monthlyUsd, 61.5);
  assert.equal(standing.find((entry) => entry.provider === "Beta").monthlyUsd, 50);
});

test("the disk-bound plateau follows the product with the most first-place finishes, skipping sizes it has no result for", () => {
  const tierViews = [
    diskTier("small", "Small", [diskRow("Alpha", 200, 60, 7000), diskRow("Beta", 100, 50, 5000)]),
    diskTier("medium", "Medium", [diskRow("Alpha", 190, 62, 7100)]),
    diskTier("large", "Large", [diskRow("Alpha", 180, 90, 7300), diskRow("Beta", 190, 80, 7600)]),
    diskTier("xlarge", "XLarge", [diskRow("Alpha", 300, 130, 30000), diskRow("Beta", 120, 120, 12000)]),
  ];
  const plateau = diskLeader(tierViews);
  assert.equal(plateau.provider, "Alpha");
  assert.deepEqual(plateau.points.map((point) => point.tier), ["small", "medium", "large", "xlarge"]);
  assert.deepEqual(plateau.points.map((point) => point.tpm), [7000, 7100, 7300, 30000]);
});

test("chart columns match seven equal control cells at narrow and wide widths", () => {
  for (const width of [280, 350, 488, 640, 1120]) {
    const centers = Array.from({ length: 7 }, (_, i) => rankColumnX(width, 7, i));
    assert.ok(centers[0] > 34);
    assert.ok(centers[6] < width - 3);
    assert.ok(Math.abs((centers[0] - 37) - (width - 3 - centers[6])) < 1e-9);
    for (let i = 1; i < 6; i++) {
      assert.ok(Math.abs((centers[i] - centers[i-1]) - (centers[i+1] - centers[i])) < 1e-9);
    }
  }
});

test("plot x switches to pixels once width is known so a resize can move the points", () => {
  assert.equal(rankPlotX(0, 7, 3), rankColumnCss(7, 3));
  assert.equal(rankPlotX(640, 7, 3), rankColumnX(640, 7, 3));
  assert.notEqual(rankPlotX(640, 7, 3), rankPlotX(1120, 7, 3));
  assert.equal(rankPlotRight(0, 12), "calc(100% - 12px)");
  assert.equal(rankPlotRight(640, 12), 628);
});

test("the end-label inset keeps the longest label inside the plot without over-reserving", () => {
  const need = 8 + 16 * 6.6 + 2; // "Google Cloud SQL" at 11px mono, plus the gap
  const rightEdge = 12;
  for (const width of [640, 820, 945, 1134]) {
    const inset = rankLabelInset(width, 7, need, rightEdge);
    const lastX = rankColumnX(width, 7, 6, inset);
    assert.ok(lastX + need <= width - rightEdge, `label overflows at ${width}`);
    assert.ok(lastX + need > width - rightEdge - 2, `inset over-reserves at ${width}`);
    assert.ok(inset > 0 && inset < width / 3);
  }
  // A short label that already fits in the natural half-column costs nothing.
  assert.equal(rankLabelInset(1134, 7, 20, 12), 0);
});

test("rankPaint draws every rank as a solid stroke, with a distinct color and the widest line for the leader", () => {
  const paints = Array.from({ length: 6 }, (_, index) => rankPaint(index));
  for (const paint of paints) {
    assert.equal("dash" in paint, false);
    assert.ok(paint.color.length > 0);
    assert.ok(paint.width > 0);
  }
  const colors = new Set(paints.map((paint) => paint.color));
  assert.equal(colors.size, paints.length);
  assert.ok(paints[0].width > paints[1].width);
  assert.ok(paints.slice(1).every((paint) => paint.width <= paints[0].width));
});

test("earliestMeasuredTo mirrors latestMeasuredTo but picks the earliest date", () => {
  const benchmarks = [
    { measuredTo: "2026-09-05T00:00:00Z" },
    { measuredTo: "2026-08-21T00:00:00Z" },
    { measuredTo: "2026-09-12T00:00:00Z" },
  ];
  assert.equal(earliestMeasuredTo(benchmarks), "2026-08-21T00:00:00Z");
  assert.equal(latestMeasuredTo(benchmarks), "2026-09-12T00:00:00Z");
  assert.equal(earliestMeasuredTo([]), new Date(0).toISOString());
});
