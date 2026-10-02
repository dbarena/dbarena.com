import type { BoundType, ColumnTier } from "@/lib/catalog";
import { METHODOLOGY_HREF } from "@/lib/site-links";

export type ChapterCopy = {
  id: string;
  boundType: BoundType;
  tiers: ColumnTier[];
  title: string;
  protocol?: string;
};

export const CHAPTERS: ChapterCopy[] = [
  {
    id: "side-project",
    boundType: "cache-fit",
    tiers: ["small", "medium"],
    title: "Side project",
  },
  {
    id: "production",
    boundType: "cache-fit",
    tiers: ["large", "xlarge", "2xlarge"],
    title: "Production",
  },
  {
    id: "heavy",
    boundType: "cache-fit",
    tiers: ["4xlarge", "8xlarge"],
    title: "Heavy load",
  },
];

export const IO_CHAPTER: ChapterCopy = {
  id: "cache-exceeding",
  boundType: "cache-exceeding",
  tiers: ["small", "medium", "large", "xlarge", "2xlarge", "4xlarge", "8xlarge"],
  title: "When your data set grows",
  protocol:
    "The benchmark data set is four times larger than available RAM, so reads need to be served by the disk.",
};

/** Authored protocol, not a catalog count: results are rebuilt until three
    runs finish clean. Edit this when the harness changes. */
export const CLEAN_RUNS = 3;

/** Said under every ranked figure and matrix, so the unit is stated once
    rather than reworded per chapter. */
export const VALUE_FOOTNOTE = "transactions/min per dollar of monthly list price.";

/** The scale note above those same figures. */
export const VALUE_SCALE_NOTE = "tpm/$ · higher is better";

export const STATS_FOOTNOTE =
  "Derived from TPC-C · all prices are list prices";

/** Index copy for the three size-path cards. Says who the ranking is for.
    Never the chapter verdict. */
export const SIZE_PATH_BLURBS: Record<string, string> = {
  "side-project": "A side project, or you're just starting out. Small and Medium.",
  production: "A live app with real traffic. Large through 2XLarge.",
  heavy: "An app under sustained load. 4XLarge and 8XLarge.",
};

export type ProtocolLabel = "Match" | "Load" | "Run" | "Publish";

export type ProtocolLine = {
  label: ProtocolLabel;
  text: string;
  href: string;
};

/** One sentence per protocol rule, each linking to the section of
    `/methodology` that states it in full. Authored, like `WHY_COPY`.
    Edit these when the harness changes. */
export const PROTOCOL_LINES: ProtocolLine[] = [
  {
    label: "Match",
    text: "We match each product based on vCPU count.",
    href: `${METHODOLOGY_HREF}#candidates`,
  },
  {
    label: "Load",
    text: "We benchmark two scenarios: either the data set fits in RAM (cache-fit) or exceeds it (cache-exceeding).",
    href: `${METHODOLOGY_HREF}#workloads`,
  },
  {
    label: "Run",
    text: "We repeat each benchmark run three times.",
    href: `${METHODOLOGY_HREF}#execution`,
  },
  {
    label: "Publish",
    text: "Every result is published with a rich set of metadata to aid reproduction.",
    href: `${METHODOLOGY_HREF}#metrics`,
  },
];

export const NOT_MEASURED =
  "So far we use only a single workload derived from TPC-C. Other workloads will stress systems differently and we plan to expand our workloads to provide a more nuanced picture. See the methodology page for more info.";

export const WHY_COPY = {
  lead: "Selecting a suitable provider to host your database involves many factors, such performance or cost. We built these benchmarks to compare alternatives based on the resource requirements of your business.",
};

export type BehindResultsItem = { flaw: string; approach: string };

/** Flaw/approach pairs for "Behind the results". Rendered as a `<dl>`, not a
    table, so they reflow to one column on mobile. */
export const BEHIND_RESULTS: BehindResultsItem[] = [
  {
    flaw: "Results are not fully reproducible and the setup is open to interpretation.",
    approach:
      "Apart from the measurement results, we provide a rich set of metadata with every test point, e.g. software versions, machine specs or system metrics of the load generator. Every step from instance setup to results generation is automated, so every aspect of the setup can be reproduced, scrutinized and improved.",
  },
  {
    flaw: "Only one data point is measured, e.g. a certain compute size.",
    approach:
      "We benchmark several common sizes across two different scenarios (data volume fits in cache, data volume exceeds the cache).",
  },
  {
    flaw: "Only absolute performance is compared.",
    approach:
      "While we strive to match hardware as closely as possible, there is no perfect hardware match across providers. Therefore, we provide two comparison options: absolute performance and price-performance. The latter allows to gauge which provider provides the best value once performance requirements are met.",
  },
];
