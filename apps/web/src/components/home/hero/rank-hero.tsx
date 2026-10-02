"use client";

import { useState } from "react";

import type { HomeData } from "@/components/home/home-data";
import { RankChart } from "./rank-chart";
import { HeroProof, selectedView } from "./hero-ui";
import { HeroHeadline } from "./hero-headline";
import { rankOverview } from "../home-evidence";
import { defaultTierIndex } from "../size-query";

export function RankHero({ data }: { data: HomeData }) {
  const [selected, setSelected] = useState(() => defaultTierIndex(data));
  const overview = rankOverview(data.rankTier);
  const view = selectedView(data, selected);
  return (
    <section className="relative px-page pt-9 pb-8 md:pt-12 md:pb-10 [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_a]:focus-visible:outline-primary [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-4 [&_button]:focus-visible:outline-primary">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(17rem,0.84fr)_minmax(0,1.26fr)] lg:gap-12">
        <header className="relative min-w-0">
          <HeroHeadline data={data} view={view} />
          <HeroProof data={data} />
        </header>
        <figure className="min-w-0">
          <h2 className="text-subhead font-medium tracking-[-0.035em]">
            OrioleDB offers superior price performance
          </h2>
          <p className="mt-2 max-w-[40rem] text-[14px]/[1.55] text-[color:var(--reading-color)] max-md:text-caption" id="rank-hero-caption">
            {overview.body}
          </p>
          <div className="mt-4 min-w-0">
            <RankChart
              captionId="rank-hero-caption"
              compact
              data={data}
              onSelect={setSelected}
              selected={selected}
            />
          </div>
        </figure>
      </div>
    </section>
  );
}
