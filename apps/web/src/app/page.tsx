import type { Metadata } from "next";

import { HomeView } from "@/components/home/home-view";
import { buildHomeData } from "@/components/home/home-data";
import { getBenchmarks } from "@/lib/benchmarks";
import { homePageMeta } from "@/lib/site-meta";

export const metadata: Metadata = {
  ...homePageMeta(),
  // adds verification for different webmaster tools. Don't remove.
  verification: {
    google: "v-IO9qInv1tpnRtgWlS8CSezB2nAcuZlCdf_gjDgPYA",
    yandex: "f42a993b598f6e26",
    other: {
      "msvalidate.01": "92FBA8A0D370D71480454DBEAB37D0AE",
    },
  },
};

export default async function Home() {
  const data = buildHomeData(await getBenchmarks());
  return <HomeView data={data} />;
}
