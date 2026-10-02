import { kickerClass, chapterTitleClass, proseClass } from "./home-layout";
import type { HomeChapter } from "./home-data";

export function ChapterHeading({ chapter, verdict = chapter.verdict }: { chapter: HomeChapter; verdict?: string }) {
  return <header>
    <p className={kickerClass}>{chapterTag(chapter)} / {chapter.range}</p>
    <h2 className={chapterTitleClass} id={`${chapter.id}-title`}>{chapter.title}</h2>
    {verdict ? <p className="mt-4 max-w-xl text-subhead font-medium">{verdict}</p> : null}
  </header>;
}

/** `01.0`-style panel tag, matching the mono tags in 26:441. */
export function chapterTag(chapter: HomeChapter) {
  return `${String(chapter.index).padStart(2, "0")}.0`;
}

export function BenchmarkNotes({ chapter }: { chapter: HomeChapter }) {
  // The workload explanation is already visible above for these chapters.
  const body = chapter.protocol
    ? chapter.body.replace(chapter.protocol, "").trim()
    : chapter.body;
  if (!body) return null;
  return <div className="mt-6 max-w-3xl"><p className={proseClass}>{body}</p></div>;
}
