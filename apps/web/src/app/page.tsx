import type { Metadata } from "next";

import { HomeView } from "@/components/home/home-view";
import { buildHomeData } from "@/components/home/home-data";
import { getBenchmarks } from "@/lib/benchmarks";
import { homePageMeta } from "@/lib/site-meta";

export const metadata: Metadata = homePageMeta();

export default async function Home() {
  const data = buildHomeData(await getBenchmarks());
  return <HomeView data={data} />;
}
