import type { Metadata } from "next";

import { providerName, TIER_OPTIONS, type BoundType } from "@/lib/catalog";
import { comparisonHref } from "@/lib/comparison-url";
import { COMPARE_HREF, HOME_HREF, METHODOLOGY_HREF } from "@/lib/site-links";

export const SITE_URL = "https://dbarena.com";
export const SITE_NAME = "DBARENA";
export const SITE_DESCRIPTION =
  "Hosted Postgres providers measured at every size. Derived from TPC-C, on-demand list price, raw results included.";

export const DEFAULT_TITLE = "Hosted Postgres provider benchmarks";

type ColumnSpec = {
  provider: string;
  tier: (typeof TIER_OPTIONS)[number]["id"];
};

function brandedTitle(title: string) {
  return `${title} · ${SITE_NAME}`;
}

function pageMeta({
  canonical,
  description,
  title,
  rootSegment = false,
}: {
  canonical: string;
  description: string;
  title?: string;
  rootSegment?: boolean;
}): Metadata {
  const documentTitle =
    title && rootSegment ? brandedTitle(title) : title;
  const socialTitle = documentTitle ?? brandedTitle(DEFAULT_TITLE);

  return {
    ...(documentTitle ? { title: documentTitle } : {}),
    description,
    alternates: { canonical },
    openGraph: {
      title: socialTitle,
      description,
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
    },
  };
}

export function homePageMeta(): Metadata {
  return pageMeta({
    canonical: HOME_HREF,
    description: SITE_DESCRIPTION,
    rootSegment: true,
  });
}

export function comparePageMeta(
  boundType: BoundType,
  columns: ColumnSpec[],
): Metadata {
  const canonical = columns.length > 0 ? comparisonHref(boundType, columns) : COMPARE_HREF;
  const labels = columns.map((column) => {
    const tier = TIER_OPTIONS.find((option) => option.id === column.tier);
    return `${providerName(column.provider)} ${tier?.label ?? column.tier}`;
  });
  const description =
    labels.length > 0 && labels.length <= 4
      ? `Compare ${labels.join(", ")} across cost, throughput, and latency.`
      : "Compare Postgres providers side by side across cost, throughput, and latency.";

  return pageMeta({ canonical, description, title: "Compare" });
}

export const methodologyPageMeta: Metadata = pageMeta({
  canonical: METHODOLOGY_HREF,
  description:
    "How DBARENA measures hosted Postgres providers: workloads, key metrics, test points, reproduction and more.",
  title: "Methodology",
});
