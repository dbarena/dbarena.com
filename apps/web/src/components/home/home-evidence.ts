import type { HomeData } from "./home-data";

/** Summarize contiguous runs without joining across unmeasured sizes. */
export function rankOverview({ tiers, lines }: HomeData["crossTier"]) {
  const runs: Array<{ key: string; names: string; start: string; end: string; index: number; count: number; shared: boolean }> = [];
  tiers.forEach((tier, index) => {
    const leaders = lines.filter(line => line.points[index]?.rank === 1 && line.points[index]?.perDollar != null);
    if (!leaders.length) return;
    const key = leaders.map(line => line.provider).sort().join("|");
    const last = runs.at(-1);
    if (last?.key === key && last.index === index - 1) {
      last.end = tier.label; last.index = index; last.count++;
    } else runs.push({ key, names: leaders.map(line => line.name).join(" and "), start: tier.label, end: tier.label, index, count: 1, shared: leaders.length > 1 });
  });
  const change = runs.find((run, index) => index > 0 && run.key !== runs[index - 1]?.key);
  return {
    emphasis: change ? `${change.start}.` : "",
    body: runs.length
      ? runs.map((run, index) => {
          const range = run.start === run.end ? `at ${run.start}` : `at ${run.start}–${run.end}`;
          const verb = index === 0 ? (run.shared ? "win on tpm/$ " : "wins on tpm/$ ") : "";
          return `${run.names} ${verb}${range}`;
        }).join(", ") + "."
      : "No priced results are available yet.",
  };
}

/** Solid lines only (P1/P3 picks): the leader is thickest and cobalt, the
    rest are foreground/grey, thinner, each a distinct shade so overlapping
    lines stay tellable apart without a dash pattern. */
export function rankPaint(index: number): { color: string; width: number } {
  if (index === 0) return { color: "var(--primary)", width: 2 };
  if (index === 1) return { color: "var(--foreground)", width: 1.5 };
  // SVG presentation attributes do not reliably resolve color-mix() in all
  // mobile WebKit views. Keep the same palette as plain sRGB theme tokens.
  return { color: `var(--rank-gray-${Math.min(index - 1, 6)})`, width: 1.25 };
}
