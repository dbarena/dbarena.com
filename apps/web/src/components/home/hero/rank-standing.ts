import type { CrossTierLine } from "@/components/home/home-data";

export const STANDING_METHOD = "Ranked by number of first-place finishes, then second and third. We use transactions/min per dollar as the metric to compare.";

export type OverallStanding = {
  line: CrossTierLine;
  place: number;
  tied: boolean;
  measured: number;
  wins: number;
};

export function overallStandings(lines: CrossTierLine[]): OverallStanding[] {
  const ranks = 3;
  // Alphabetical ordering only stabilizes rendering within a shared position.
  const sorted = [...lines].sort((a, b) => compareStanding(a, b, ranks) || a.name.localeCompare(b.name));
  let place = 1;
  return sorted.map((line, index) => {
    const previous = sorted[index - 1];
    const next = sorted[index + 1];
    const sameAsPrevious = previous !== undefined && compareStanding(previous, line, ranks) === 0;
    if (!sameAsPrevious) place = index + 1;
    return {
      line,
      place,
      tied: sameAsPrevious || (next !== undefined && compareStanding(line, next, ranks) === 0),
      measured: line.points.filter(point => point.rank !== null && point.perDollar !== null).length,
      wins: line.points.filter(point => point.rank === 1 && point.perDollar !== null).length,
    };
  });
}

function compareStanding(left: CrossTierLine, right: CrossTierLine, ranks: number) {
  const a = placeCounts(left, ranks);
  const b = placeCounts(right, ranks);
  for (let rank = 0; rank < ranks; rank += 1) {
    const diff = b[rank]! - a[rank]!;
    if (diff !== 0) return diff;
  }
  return 0;
}

function placeCounts(line: CrossTierLine, ranks: number) {
  const counts = Array.from({ length: ranks }, () => 0);
  for (const point of line.points) {
    if (point.rank == null || point.perDollar == null) continue;
    const index = point.rank - 1;
    if (index >= 0 && index < counts.length) counts[index] += 1;
  }
  return counts;
}

export function standingsAtSize(standings: OverallStanding[], sizeIndex: number) {
  return [...standings].sort((left, right) => {
    const a = left.line.points[sizeIndex];
    const b = right.line.points[sizeIndex];
    const aRank = a?.rank == null || a.perDollar == null ? null : a.rank;
    const bRank = b?.rank == null || b.perDollar == null ? null : b.rank;
    if (aRank == null && bRank == null) return left.place - right.place;
    if (aRank == null) return 1;
    if (bRank == null) return -1;
    if (aRank !== bRank) return aRank - bRank;
    return (b.perDollar ?? 0) - (a.perDollar ?? 0) || left.place - right.place;
  });
}
