import "./source-loader.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const { PROVIDER_NAMES } = await import("../src/lib/catalog.ts");
const { buildHomeData } = await import("../src/components/home/home-data.ts");
const { overallStandings } = await import("../src/components/home/hero/rank-standing.ts");
const { CLEAN_RUNS } = await import("../src/components/home/home-copy.ts");
const { FAQ_COPY } = await import("../src/components/home/faq-copy.ts");

const HOME_DIR = fileURLToPath(new URL("../src/components/home/", import.meta.url));

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

// Product names and slugs belong to the catalog. If one appears in a component
// or in copy, publishing a new result can no longer change what the page says.
test("no homepage source names a product", () => {
  const slugs = Object.keys(PROVIDER_NAMES);
  const names = Object.values(PROVIDER_NAMES);
  // Three exemptions, all allowed by components/home/README.md:
  //   - sponsorship disclosure names the site's owner, which says nothing
  //     about the ranking;
  //   - a brand-spelling table maps a catalog slug to how that brand is
  //     written, which is presentation, not a verdict.
  //   - the approved hero headline names OrioleDB; the chart and body remain derived.
  const sponsorDisclosure = new Set(["home-copy.ts", "faq-copy.ts"]);
  const brandSpelling = new Set(["home-narrative-text.ts"]);

  for (const path of sourceFiles(HOME_DIR)) {
    const source = readFileSync(path, "utf8");
    const file = path.slice(HOME_DIR.length);
    if (brandSpelling.has(file)) continue;
    if (file === "hero/rank-hero.tsx") {
      assert.match(source, /OrioleDB offers superior price performance/);
    }
    const checkedSource = file === "hero/rank-hero.tsx"
      ? source.replace("OrioleDB offers superior price performance", "")
      : source;
    for (const needle of [...slugs, ...names]) {
      if (sponsorDisclosure.has(file) && /^supabase$/i.test(needle)) continue;
      assert.ok(
        !new RegExp(`\\b${needle}\\b`, "i").test(checkedSource),
        `${file} names the product "${needle}"; derive it from the catalog instead`,
      );
    }
  }
});

function benchmark(provider, tier, value) {
  return {
    provider, host: provider, tier, boundType: "cache-fit", variant: null, scenario: "tpcc",
    path: `${provider}/${tier}.json`, instanceType: "test", vcpu: 2, ramGb: 8, diskGb: 100,
    iops: null, throughputMbps: null, measuredTo: "2026-09-01T00:00:00Z", monthlyUsd: 50,
    terminalConcurrency: 20, terminalThroughput: value * 50, terminalThroughputPerDollar: value,
    terminalP95LatencyMs: 5, newOrderSeries: null, lowVsMedian: null,
  };
}

const TIERS = ["small", "medium", "large", "xlarge", "2xlarge", "4xlarge", "8xlarge"];
const spread = (provider, value) => TIERS.map((tier) => benchmark(provider, tier, value));

test("the leader card follows the standings when results change", () => {
  const data = buildHomeData([...spread("alpha", 100), ...spread("beta", 200)]);
  assert.equal(overallStandings(data.crossTier.lines)[0].line.provider, "beta");

  const flipped = buildHomeData([...spread("alpha", 300), ...spread("beta", 200)]);
  assert.equal(overallStandings(flipped.crossTier.lines)[0].line.provider, "alpha");
});

test("a tie is reported as shared first place, not resolved to one product", () => {
  const data = buildHomeData([...spread("alpha", 100), ...spread("beta", 100)]);
  const first = overallStandings(data.crossTier.lines).filter((s) => s.place === 1);
  assert.equal(first.length, 2);
  assert.ok(first.every((standing) => standing.tied));
});

test("the stats band reports the catalog's own counts", () => {
  const benchmarks = [...spread("alpha", 100), ...spread("beta", 200)];
  const data = buildHomeData(benchmarks);
  assert.equal(data.stats.results, benchmarks.length);
  assert.equal(data.stats.providers, 2);
  assert.equal(data.crossTier.tiers.length, TIERS.length);
  // Authored protocol rather than a count, so it must stay a constant.
  assert.equal(CLEAN_RUNS, 3);
});

test("FAQ answers name no product and stay in sync with the schema", () => {
  const slugs = Object.keys(PROVIDER_NAMES);
  const names = Object.values(PROVIDER_NAMES);
  for (const item of FAQ_COPY.items) {
    const text = `${item.question} ${item.answer}`;
    for (const needle of [...slugs, ...names]) {
      // The sponsorship answer names the owner on purpose; nothing else may.
      if (/^supabase$/i.test(needle)) continue;
      assert.ok(
        !new RegExp(`\\b${needle}\\b`, "i").test(text),
        `FAQ item "${item.question}" names the product "${needle}"`,
      );
    }
    assert.ok(item.question.endsWith("?"), `"${item.question}" should be a question`);
    assert.ok(item.answer.length > 40, `"${item.question}" needs a real answer`);
  }
  // Only the sponsorship answer may name Supabase.
  const naming = FAQ_COPY.items.filter((item) => /supabase/i.test(item.answer));
  assert.equal(naming.length, 1);
  // The disclosure has to state both halves: that the site is not
  // independent, and who owns it. The wording may change; both halves may not.
  assert.match(naming[0].answer, /^No\./);
  assert.match(naming[0].answer, /built and sponsored/);
});
