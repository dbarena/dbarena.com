import type { Metadata } from "next";

import { providerName, TIER_OPTIONS } from "@/lib/catalog";
import { COMPARE_HREF, HOME_HREF, METHODOLOGY_HREF } from "@/lib/site-links";

export const SITE_URL = "https://dbarena.com";
export const SITE_NAME = "DBArena";
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

/** Every `?bound=…&cols=…` variant canonicalises to bare `/compare`, so the
    interactive tool is one indexable page rather than one per combination. */
export function comparePageMeta(columns: ColumnSpec[]): Metadata {
  const labels = columns.map((column) => {
    const tier = TIER_OPTIONS.find((option) => option.id === column.tier);
    return `${providerName(column.provider)} ${tier?.label ?? column.tier}`;
  });
  const description =
    labels.length > 0 && labels.length <= 4
      ? `Compare ${labels.join(", ")} across cost, throughput, and latency.`
      : "Compare Postgres providers side by side across cost, throughput, and latency.";

  return pageMeta({ canonical: COMPARE_HREF, description, title: "Compare providers" });
}

export const methodologyPageMeta: Metadata = pageMeta({
  canonical: METHODOLOGY_HREF,
  description:
    "How DBArena measures hosted Postgres providers: workloads, key metrics, test points, reproduction and more.",
  title: "Methodology",
});
