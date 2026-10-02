import type { MetadataRoute } from "next";

import { getBenchmarks } from "@/lib/benchmarks";
import { latestMeasuredTo } from "@/lib/leaderboard";
import { COMPARE_HREF, METHODOLOGY_HREF } from "@/lib/site-links";
import { SITE_URL } from "@/lib/site-meta";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date(latestMeasuredTo(await getBenchmarks()));

  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}${COMPARE_HREF}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}${METHODOLOGY_HREF}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
