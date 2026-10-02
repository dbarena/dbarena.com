import type { ChapterCopy } from "./home-copy";
import { writeBody, writeVerdict } from "./home-narrative-body";
import {
  detectStory,
  filled,
  type NarrativeContext,
  type NarrativeSize,
} from "./home-narrative-story";
import { joinAnd, sizeWord, writeRange } from "./home-narrative-text";

export type { NarrativeContext, NarrativeRow, NarrativeSize } from "./home-narrative-story";

export type WrittenCopy = { range: string; verdict: string; body: string };

export function bindChapter<T extends NarrativeSize>(
  copy: ChapterCopy,
  index: number,
  tierViews: T[],
  context: NarrativeContext,
) {
  return {
    ...copy,
    ...writeChapterCopy(copy, tierViews, context),
    index,
    tierViews,
  };
}

function writeChapterCopy(
  chapter: ChapterCopy,
  sizes: NarrativeSize[],
  context: NarrativeContext,
): WrittenCopy {
  const present = filled(sizes);
  // Incomplete ranges and shared leads need explicit scopes, not sweep/handover claims.
  if (present.length > 0 && (present.length < sizes.length || present.some(size => size.rows.filter(row => row.rank === 1).length > 1))) {
    return {
      range: writeRange(chapter.tiers, chapter.boundType),
      verdict: "First place on tpm/$, size by size.",
      body: present.map(size => {
        const leaders = size.rows.filter(row => row.rank === 1);
        return `${joinAnd(leaders.map(row => row.name))} ${leaders.length > 1 ? "share first place" : "is first"} at ${sizeWord(size.tier)}.`;
      }).join(" "),
    };
  }
  const story = detectStory(chapter, sizes, context);
  return {
    range: writeRange(chapter.tiers, chapter.boundType),
    verdict: writeVerdict(story, chapter, filled(sizes)),
    body: writeBody(story, chapter, sizes),
  };
}
