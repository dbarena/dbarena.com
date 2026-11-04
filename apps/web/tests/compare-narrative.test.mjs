import "./source-loader.mjs";
import assert from "node:assert/strict";
import test from "node:test";

const { buildNarrative, NARRATIVE_TIE_THRESHOLD } = await import("../src/lib/compare-narrative.ts");

function column(id, provider, tier, { value, tpm, p95, variant = null }) {
  return {
    id, provider, tier, variant,
    benchmark: {
      provider, host: provider, tier, variant, boundType: "cache-exceeding", scenario: "tpcc",
      terminalThroughputPerDollar: value, terminalThroughput: tpm, terminalP95LatencyMs: p95,
    },
  };
}

const sup = (over = {}, tier = "medium") => column("a", "supabase", tier, { value: 57, tpm: 4983, p95: 40, ...over });
const rds = (over = {}, tier = "medium") => column("b", "rds", tier, { value: 29, tpm: 4489, p95: 95, ...over });
const gcp = (over = {}, tier = "medium") => column("c", "cloud-sql-for-postgres", tier, { value: 20, tpm: 3000, p95: 120, ...over });

test("one configuration has nothing to compare against", () => {
  assert.equal(buildNarrative([sup()], "cache-exceeding"), null);
  assert.equal(buildNarrative([], "cache-exceeding"), null);
});

test("two columns: the leader is named with the other and the conditions", () => {
  const [text, ...rest] = buildNarrative([sup(), rds()], "cache-exceeding");
  assert.equal(rest.length, 0);
  assert.match(text, /^Compared to Amazon RDS, Supabase Postgres leads on /);
  assert.match(text, /price-performance \(57 vs 29 tpm\/\$\)/);
  assert.match(text, /throughput \(4,983 vs 4,489 tpm\)/);
  assert.match(text, /p95 latency \(40 vs 95 ms\)/);
  assert.match(text, /at Medium size with the cache exceeding scenario\.$/);
});

test("lower wins on latency", () => {
  const level = { value: 100, tpm: 1000 };
  const [text, ...rest] = buildNarrative([sup({ ...level, p95: 200 }), rds({ ...level, p95: 95 })], "cache-exceeding");
  assert.equal(rest.length, 1); // the "level" note for the other two metrics
  assert.match(text, /^Compared to Supabase Postgres, Amazon RDS leads on p95 latency \(95 vs 200 ms\)/);
});

test("three columns: every other column is named and figures use next best", () => {
  const [text] = buildNarrative([sup(), rds(), gcp()], "cache-exceeding");
  assert.match(text, /^Compared to Amazon RDS and Google Cloud SQL for PostgreSQL, Supabase Postgres leads on /);
  assert.match(text, /price-performance \(57 tpm\/\$, next best 29 tpm\/\$\)/);
});

test("split leaders each get their own sentence, most leads first", () => {
  const paragraphs = buildNarrative([sup({ p95: 200 }), rds({ p95: 95 })], "cache-exceeding");
  assert.equal(paragraphs.length, 2);
  assert.match(paragraphs[0], /^Compared to Amazon RDS, Supabase Postgres leads on price-performance/);
  assert.match(paragraphs[1], /^Amazon RDS leads on p95 latency \(95 vs 200 ms\)\.$/);
});

test("results within the tie threshold are level, not a lead", () => {
  assert.equal(NARRATIVE_TIE_THRESHOLD, 0.03);
  const paragraphs = buildNarrative([sup({ tpm: 4600 }), rds({ tpm: 4500 })], "cache-exceeding");
  assert.ok(!paragraphs[0].includes("throughput"), "throughput is not claimed as a lead");
  assert.ok(paragraphs.some((p) => /^Throughput is within 3% across these configurations\.$/.test(p)));
});

test("when every metric is level, no one leads", () => {
  const paragraphs = buildNarrative(
    [sup({ value: 100, tpm: 1000, p95: 50 }), rds({ value: 101, tpm: 1010, p95: 50 })],
    "cache-exceeding",
  );
  assert.equal(paragraphs.length, 1);
  assert.match(paragraphs[0], /are within 3% of each other/);
  assert.ok(!/leads/.test(paragraphs[0]));
});

test("mixed sizes label every column with its size and say it is not like for like", () => {
  const paragraphs = buildNarrative([sup({}, "large"), rds({}, "small")], "cache-fit");
  assert.match(paragraphs[0], /Compared to Amazon RDS \(Small\), Supabase Postgres \(Large\) leads/);
  assert.match(paragraphs[0], /at mixed sizes with the cache fit scenario\.$/);
  assert.equal(paragraphs.at(-1), "These configurations are different sizes, so the comparison is not like for like.");
});

test("the same provider twice is told apart by size", () => {
  const a = column("a", "supabase", "medium", { value: 57, tpm: 4983, p95: 40 });
  const b = column("b", "supabase", "large", { value: 30, tpm: 8000, p95: 30 });
  const [first] = buildNarrative([a, b], "cache-exceeding");
  assert.match(first, /Supabase Postgres \((Medium|Large)\)/);
  assert.ok(first.includes("Supabase Postgres (Medium)") && first.includes("Supabase Postgres (Large)"));
});

test("a column missing a metric is skipped for that metric", () => {
  const paragraphs = buildNarrative([sup({ value: null }), rds({ value: 29 })], "cache-exceeding");
  assert.ok(!paragraphs.join(" ").includes("price-performance"));
});

test("the narrative source names no product", () => {
  // Names come from the catalog at run time; none may be written into the copy.
  return import("node:fs").then(({ readFileSync }) => {
    const source = readFileSync(new URL("../src/lib/compare-narrative.ts", import.meta.url), "utf8");
    return import("../src/lib/catalog.ts").then(({ PROVIDER_NAMES }) => {
      for (const needle of [...Object.keys(PROVIDER_NAMES), ...Object.values(PROVIDER_NAMES)]) {
        assert.ok(!new RegExp(`\\b${needle}\\b`, "i").test(source), `compare-narrative.ts names "${needle}"`);
      }
    });
  });
});
