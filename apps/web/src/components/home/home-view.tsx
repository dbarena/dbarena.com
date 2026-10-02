import { MethodJumpNav } from "@/components/methodology/method-jump-nav";
import { EditorialChapter } from "./editorial-chapters";
import { HomeMethod } from "./home-method";
import { IoChapter } from "./io-chapter";
import type { HomeData } from "./home-data";
import { RankHero } from "./hero/rank-hero";
import { PriceLatency } from "./price-latency";
import { SizePaths } from "./size-paths";
import { Faq } from "./faq";

export function HomeView({ data }: { data: HomeData }) {
  const jumps = [
    ...data.chapters.map((chapter) => ({
      id: chapter.id,
      label: chapter.title,
    })),
    { id: data.io.id, label: "When your data set grows" },
    { id: "price-latency", label: "Key metrics" },
    { id: "why", label: "Behind the results" },
    { id: "faq", label: "FAQ" },
  ];
  return (
    <main id="main">
      <RankHero data={data} />
      <SizePaths chapters={data.chapters} />
      <div className="px-page lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12">
        <MethodJumpNav sections={jumps} />
        <div className="min-w-0">
          {data.chapters.map((chapter) => (
            <EditorialChapter chapter={chapter} key={chapter.id} />
          ))}
          <IoChapter chapter={data.io} />
          <PriceLatency data={data} />
          <HomeMethod />
          <Faq data={data} />
        </div>
      </div>
    </main>
  );
}
