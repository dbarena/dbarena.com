import "./source-loader.mjs";
import assert from "node:assert/strict";
import test from "node:test";

const { buildNarrative, NARRATIVE_TIE_THRESHOLD, NARRATIVE_PRICE_TIE_THRESHOLD } = await import("../src/lib/compare-narrative.ts");

function column(id, provider, tier, { value, tpm, p95, usd, variant = null }) {
  return {
    id, provider, tier, variant,
    benchmark: {
      provider, host: provider, tier, variant, boundType: "cache-exceeding", scenario: "tpcc",
      terminalThroughputPerDollar: value, terminalThroughput: tpm, terminalP95LatencyMs: p95, monthlyUsd: usd,
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

// --- cost ---------------------------------------------------------------

const LEVEL = { value: 100, tpm: 1000, p95: 50 };

test("price tolerance is much tighter than the measurement tolerance", () => {
  assert.equal(NARRATIVE_PRICE_TIE_THRESHOLD, 0.01);
  assert.ok(NARRATIVE_PRICE_TIE_THRESHOLD < NARRATIVE_TIE_THRESHOLD);
});

test("the cheapest column that also leads gets the cost on its own sentence", () => {
  const [text, ...rest] = buildNarrative([sup({ usd: 41.5 }), rds({ usd: 113.26 })], "cache-exceeding");
  assert.equal(rest.length, 0);
  assert.match(text, /^Compared to Amazon RDS, Supabase Postgres leads on /);
  assert.match(text, /, and costs less per month \(\$41\.50 vs \$113\.26\)\.$/);
});

test("cost never says leads", () => {
  const text = buildNarrative([sup({ usd: 41.5 }), rds({ usd: 113.26 })], "cache-exceeding").join(" ");
  assert.ok(!/leads on (monthly list price|cost|price)(?![-\w])/.test(text), text);
});

test("with three columns the cost figure is against the next best", () => {
  const [text] = buildNarrative(
    [sup({ usd: 41.5 }), rds({ usd: 88 }), gcp({ usd: 155.62 })],
    "cache-exceeding",
  );
  assert.match(text, /costs less per month \(\$41\.50, next best \$88\.00\)\.$/);
});

test("a cheapest column with no performance lead gets its own sentence", () => {
  const paragraphs = buildNarrative(
    [sup({ ...LEVEL, usd: 90 }), rds({ ...LEVEL, usd: 40 })],
    "cache-exceeding",
  );
  assert.match(paragraphs[0], /are within 3% of each other on price-performance, throughput and p95 latency at Medium size/);
  assert.equal(paragraphs[1], "Amazon RDS costs less per month ($40.00 vs $90.00).");
  assert.ok(!paragraphs.some((p) => /leads/.test(p)));
});

test("tradeoff: faster column is not the cheapest one, and the cheaper one leads on price-performance", () => {
  const paragraphs = buildNarrative(
    [sup({ value: 40, tpm: 5000, p95: 50, usd: 125 }), rds({ value: 80, tpm: 4000, p95: 50, usd: 50 })],
    "cache-exceeding",
  );
  assert.ok(
    paragraphs.includes(
      "Supabase Postgres has the higher throughput, while Amazon RDS costs less per month ($50.00 vs $125.00) and leads on price-performance.",
    ),
    paragraphs.join(" | "),
  );
  // The cost is said once, in the tradeoff sentence, not again on the leader's.
  assert.equal(paragraphs.join(" ").match(/costs less per month/g).length, 1);
});

test("tradeoff: faster column also leads on price-performance despite costing more", () => {
  const paragraphs = buildNarrative(
    [sup({ value: 90, tpm: 5000, p95: 50, usd: 60 }), rds({ value: 40, tpm: 4000, p95: 50, usd: 50 })],
    "cache-exceeding",
  );
  assert.ok(
    paragraphs.includes(
      "Supabase Postgres has the higher throughput and leads on price-performance, even though Amazon RDS costs less per month ($50.00 vs $60.00).",
    ),
    paragraphs.join(" | "),
  );
});

test("with three columns the tradeoff says highest", () => {
  const paragraphs = buildNarrative(
    [
      sup({ value: 40, tpm: 5000, p95: 50, usd: 125 }),
      rds({ value: 80, tpm: 4000, p95: 50, usd: 50 }),
      gcp({ value: 20, tpm: 3000, p95: 80, usd: 150 }),
    ],
    "cache-exceeding",
  );
  assert.ok(paragraphs.some((p) => /has the highest throughput, while Amazon RDS costs less per month \(\$50\.00, next best \$125\.00\)/.test(p)), paragraphs.join(" | "));
});

test("equal prices are priced the same, near prices are within 1%", () => {
  const same = buildNarrative([sup({ usd: 50 }), rds({ usd: 50 })], "cache-exceeding");
  assert.ok(same.includes("These configurations are priced the same."));
  assert.ok(!same.join(" ").includes("costs less"));

  const near = buildNarrative([sup({ usd: 50 }), rds({ usd: 50.2 })], "cache-exceeding");
  assert.ok(near.includes("Monthly list price is within 1% across these configurations."));
  assert.ok(!near.join(" ").includes("costs less"));

  // 5% apart is a real difference.
  const apart = buildNarrative([sup({ usd: 50 }), rds({ usd: 52.5 })], "cache-exceeding").join(" ");
  assert.match(apart, /costs less per month/);
});

test("mixed sizes leave cost out", () => {
  const paragraphs = buildNarrative([sup({ usd: 41.5 }, "large"), rds({ usd: 113.26 }, "small")], "cache-exceeding");
  assert.ok(!paragraphs.join(" ").includes("per month"));
  assert.ok(!paragraphs.join(" ").includes("priced"));
  assert.equal(paragraphs.at(-1), "These configurations are different sizes, so the comparison is not like for like.");
});

test("missing prices are skipped", () => {
  const paragraphs = buildNarrative([sup({ usd: null }), rds({ usd: 113.26 })], "cache-exceeding");
  assert.ok(!paragraphs.join(" ").includes("per month"));
});

test("when only the top two are level the note says so", () => {
  const paragraphs = buildNarrative(
    [sup({ tpm: 5000 }), rds({ tpm: 4950 }), gcp({ tpm: 3000 })],
    "cache-exceeding",
  );
  assert.ok(
    paragraphs.some((p) => /Throughput is within 3% between the top two\./.test(p)),
    paragraphs.join(" | "),
  );
  assert.ok(!paragraphs.some((p) => /Throughput is within 3% across/.test(p)));
});
