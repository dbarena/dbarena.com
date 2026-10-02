import "./source-loader.mjs";
import assert from "node:assert/strict";
import test from "node:test";

const { readComparisonState } = await import("../src/lib/comparison-url.ts");

const benchmarks = ["cache-fit", "cache-exceeding"].flatMap((boundType) =>
  ["rds", "supabase"].map((provider) => ({
    provider,
    host: provider,
    tier: "small",
    boundType,
    variant: null,
  })),
);

test("Compare defaults to cache-exceeding and honors an explicit cache-fit URL", () => {
  const initial = readComparisonState({}, benchmarks);
  assert.equal(initial.boundType, "cache-exceeding");
  assert.deepEqual(initial.columns.map((column) => column.provider), ["rds", "supabase"]);
  assert.equal(readComparisonState({ bound: "invalid" }, benchmarks).boundType, "cache-exceeding");
  assert.equal(readComparisonState({ bound: "cache-fit" }, benchmarks).boundType, "cache-fit");
});
