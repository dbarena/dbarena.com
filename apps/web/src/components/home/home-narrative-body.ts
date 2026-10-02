import type { ChapterCopy } from "./home-copy";
import {
  filled,
  leadRuns,
  type NarrativeSize,
  type Story,
} from "./home-narrative-story";
import {
  factorLabel,
  percentMore,
  sizeParenthetical,
  sizeWord,
} from "./home-narrative-text";

function valueLead(size: NarrativeSize) {
  const lead = size.rows[0];
  if (!lead?.perDollar) return null;
  const second = size.rows[1];
  const at = sizeParenthetical(size.tier);
  if (second?.perDollar != null) {
    const gap = percentMore(lead.perDollar, second.perDollar);
    if (gap != null && gap > 0) {
      return `At ${at}, ${lead.name} achieves ${gap}% more peak throughput per dollar than ${second.name}.`;
    }
  }
  return `At ${at}, tpm/$ is highest for ${lead.name} on monthly list price.`;
}

function sweepScope(sizes: NarrativeSize[], title: string) {
  if (sizes.length === 1) return sizeWord(sizes[0]!.tier);
  if (sizes.length === 2) return `${sizeWord(sizes[0]!.tier)} and ${sizeWord(sizes[1]!.tier)}`;
  return `every ${title.toLowerCase()} size`;
}

function firstPlaceLine(sizes: NarrativeSize[]) {
  return leadRuns(filled(sizes)).map((run, index) => {
    const start = run.sizes[0]!;
    const end = run.sizes[run.sizes.length - 1]!;
    const range = start.tier === end.tier
      ? sizeWord(start.tier)
      : `${sizeWord(start.tier)}–${sizeWord(end.tier)}`;
    const verb = index === 0 ? "wins on tpm/$ " : "";
    return `${run.row.name} ${verb}at ${range}`;
  }).join(", ") + ".";
}

export function writeVerdict(story: Story, chapter: ChapterCopy, sizes: NarrativeSize[]) {
  switch (story.kind) {
    case "empty":
      return "Not measured at this size.";
    case "plateau":
      return "Peak throughput barely moves across this range.";
    case "blowout":
      return `At ${sizeWord(story.size.tier)}, throughput differs by ${factorLabel(story.factor)}× from first to second.`;
    case "handover":
    case "split":
      return firstPlaceLine(sizes);
    case "sweep":
      return `${story.leader.name} wins on tpm/$ at ${sweepScope(sizes, chapter.title)}.`;
    default: {
      const exhaustive: never = story;
      return exhaustive;
    }
  }
}

export function writeBody(story: Story, chapter: ChapterCopy, sizes: NarrativeSize[]) {
  const present = filled(sizes);
  switch (story.kind) {
    case "empty":
      return chapter.protocol ?? "";
    case "plateau":
      return chapter.protocol ?? "";
    default:
      return present[0] ? valueLead(present[0]) ?? "" : "";
  }
}
