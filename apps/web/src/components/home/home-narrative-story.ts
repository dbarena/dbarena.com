import type { ColumnTier } from "@/lib/catalog";

import type { ChapterCopy } from "./home-copy";

export type NarrativeRow = {
  provider: string;
  name: string;
  host: string;
  rank: number;
  perDollar: number | null;
  tpm: number;
};

export type NarrativeSize = {
  tier: ColumnTier;
  situation: string;
  rows: NarrativeRow[];
};

export type LeadRun = { row: NarrativeRow; sizes: NarrativeSize[] };

export type Story =
  | { kind: "empty" }
  | { kind: "plateau" }
  | { kind: "blowout"; leader: NarrativeRow; rival: NarrativeRow; size: NarrativeSize; factor: number }
  | { kind: "handover"; from: NarrativeRow; to: NarrativeRow; at: NarrativeSize }
  | { kind: "sweep"; leader: NarrativeRow; sizes: NarrativeSize[] }
  | { kind: "split"; runs: LeadRun[] };

export const PLATEAU_RATIO = 1.08;
export const BLOWOUT_FACTOR = 2;

export function filled(sizes: NarrativeSize[]) {
  return sizes.map(size => ({ ...size, rows: size.rows.filter(row => row.perDollar != null && Number.isFinite(row.perDollar) && row.perDollar > 0) }))
    .filter(size => size.rows.length > 0);
}

export function leadRuns(sizes: NarrativeSize[]): LeadRun[] {
  const runs: LeadRun[] = [];
  for (const size of filled(sizes)) {
    const lead = size.rows[0]!;
    const current = runs[runs.length - 1];
    if (current && current.row.provider === lead.provider) current.sizes.push(size);
    else runs.push({ row: lead, sizes: [size] });
  }
  return runs;
}

function plateauFor(sizes: NarrativeSize[], provider: string) {
  const present = sizes;
  let best: NarrativeSize[] = [];
  for (let start = 0; start < present.length; start += 1) {
    const row0 = present[start]!.rows.find((row) => row.provider === provider);
    if (!row0) continue;
    const run = [present[start]!];
    let min = row0.tpm;
    let max = row0.tpm;
    for (let end = start + 1; end < present.length; end += 1) {
      const row = present[end]!.rows.find((entry) => entry.provider === provider);
      if (!row) break;
      const nextMin = Math.min(min, row.tpm);
      const nextMax = Math.max(max, row.tpm);
      if (nextMin <= 0 || nextMax / nextMin > PLATEAU_RATIO) break;
      min = nextMin;
      max = nextMax;
      run.push(present[end]!);
    }
    if (run.length > best.length) best = run;
  }
  return best;
}

/** The blowout story is about the gap to whoever actually placed second, not
    whichever product opened the range. Rows are already ranked by value, so
    the runner-up is always the second entry. */
function rivalAt(size: NarrativeSize) {
  return size.rows[1] ?? null;
}

export type NarrativeContext = {
  opening: NarrativeRow | null;
  prior: NarrativeRow | null;
};

export function detectStory(
  chapter: ChapterCopy,
  sizes: NarrativeSize[],
  context: NarrativeContext,
): Story {
  const present = filled(sizes);
  const runs = leadRuns(present);
  if (present.length === 0 || runs.length === 0) return { kind: "empty" };

  if (chapter.boundType === "cache-exceeding") {
    const candidate = runs[0]!.row;
    const run = plateauFor(sizes, candidate.provider);
    if (run.length >= 3) return { kind: "plateau" };
  }

  const last = present[present.length - 1]!;
  const leader = last.rows[0]!;
  const rival = rivalAt(last);
  const factor = rival && rival.tpm > 0 ? leader.tpm / rival.tpm : 0;
  if (present.some((size) => size.tier === "8xlarge") && rival && factor >= BLOWOUT_FACTOR) {
    return { kind: "blowout", leader, rival, size: last, factor };
  }

  const firstLead = present[0]!.rows[0]!;
  if (
    chapter.boundType !== "cache-exceeding" &&
    context.prior &&
    firstLead.provider !== context.prior.provider &&
    present.every((size) => size.rows[0]?.provider === firstLead.provider)
  ) {
    return { kind: "handover", from: context.prior, to: firstLead, at: present[0]! };
  }

  if (runs.length === 2) {
    return {
      kind: "handover",
      from: runs[0]!.row,
      to: runs[1]!.row,
      at: runs[1]!.sizes[0]!,
    };
  }
  if (runs.length === 1) return { kind: "sweep", leader: runs[0]!.row, sizes: present };
  return { kind: "split", runs };
}
