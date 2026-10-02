import { TIER_OPTIONS, type BoundType, type ColumnTier } from "@/lib/catalog";
import { formatInteger } from "@/lib/format";

const COUNTS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
] as const;

export function countWord(value: number) {
  return value >= 0 && value < COUNTS.length ? COUNTS[value]! : formatInteger(value);
}

export function joinAnd(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function sizeWord(tier: ColumnTier) {
  return TIER_OPTIONS.find((option) => option.id === tier)?.label ?? tier;
}

export function sizeParenthetical(tier: ColumnTier) {
  const option = optionFor(tier);
  if (!option) return sizeWord(tier);
  return `${sizeWord(tier)} (${option.compute} · ${option.memory})`;
}

export function rankWord(rank: number, last: boolean) {
  if (last && rank > 2) return "last";
  if (rank === 1) return "first";
  if (rank === 2) return "second";
  if (rank === 3) return "third";
  return `${rank}th`;
}

export function percentMore(leader: number, other: number) {
  if (other <= 0) return null;
  return Math.round(((leader - other) / other) * 100);
}

export function timesPhrase(factor: number) {
  const rounded = Math.round(factor * 10) / 10;
  if (Math.abs(rounded - 2) < 0.05) return "twice";
  if (Math.abs(rounded - 3) < 0.05) return "three times";
  return `${rounded.toFixed(1)} times`;
}

export function factorLabel(factor: number) {
  return (Math.round(factor * 10) / 10).toFixed(1);
}

export function optionFor(tier: ColumnTier) {
  return TIER_OPTIONS.find((entry) => entry.id === tier);
}

export function writeRange(tiers: ColumnTier[], boundType: BoundType) {
  if (boundType === "cache-exceeding" && tiers.length === TIER_OPTIONS.length) {
    return `All ${countWord(tiers.length)} sizes, cache exceed`;
  }
  const options = tiers.map((tier) => optionFor(tier)).filter(Boolean);
  const first = options[0];
  const last = options[options.length - 1];
  if (!first || !last) return "";
  const sameCompute = options.every((option) => option!.compute === first.compute);
  const compute = sameCompute
    ? first.compute
    : `${first.compute.replace(" vCPU", "")}–${last.compute}`;
  const memory =
    first.memory === last.memory
      ? first.memory
      : `${first.memory.replace(" GiB", "")}–${last.memory}`;
  return `${compute} · ${memory}`;
}
