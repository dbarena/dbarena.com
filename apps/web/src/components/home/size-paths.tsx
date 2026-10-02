import { SIZE_PATH_BLURBS } from "./home-copy";
import type { HomeChapter } from "./home-data";
import { chapterTitleClass, kickerClass } from "./home-layout";
import { SizePathCard } from "./size-path-card";

/**
 * Jump cards for the three cache-fit chapters. Situation copy only. The
 * chapter verdict stays out, so this reads as an index.
 */
export function SizePaths({ chapters }: { chapters: HomeChapter[] }) {
  return (
    <section
      aria-labelledby="size-paths-title"
      className="border-t border-border px-page py-8"
    >
      <p className={kickerClass}>What size fits your app?</p>
      <h2 className={chapterTitleClass} id="size-paths-title">
        Pick <span className="text-muted-foreground">an appropriate size</span>
      </h2>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {chapters.map((chapter) => (
          <SizePathCard
            blurb={SIZE_PATH_BLURBS[chapter.id] ?? chapter.range}
            href={`#${chapter.id}`}
            key={chapter.id}
            kind={markKind(chapter.id)}
            range={sizeSpan(chapter)}
            title={chapter.title}
          />
        ))}
      </div>
    </section>
  );
}

function markKind(id: string): "side-project" | "production" | "heavy" {
  if (id === "production") return "production";
  if (id === "heavy") return "heavy";
  return "side-project";
}

function sizeSpan(chapter: HomeChapter) {
  const first = chapter.tierViews[0]?.label;
  const last = chapter.tierViews.at(-1)?.label;
  if (!first) return chapter.range;
  if (!last || last === first) return first;
  return `${first}–${last}`;
}
