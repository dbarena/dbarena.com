import { cadenceAnswer, faqDateRange } from "./faq-dates";
import { NOT_MEASURED } from "./home-copy";
import type { HomeData } from "./home-data";
import { METHODOLOGY_HREF } from "@/lib/site-links";

export type FaqItem = {
  question: string;
  answer: string;
  link?: { text: string; href: string };
};

/**
 * Authored policy, like the methodology and tier definitions. Every static
 * answer here restates a documented rule. None of them make a claim about a
 * product, and none of them can be derived from the catalog.
 *
 * The "how often do results update" answer is derived, so it is not stored
 * here. `buildFaqItems()` splices it in from `faq-dates.ts`; a static string
 * cannot hold a real earliest/latest date.
 */
export const FAQ_COPY = {
  heading: "Frequently asked questions",
  items: [
    {
      question: "Why do you rank by price-performance (transactions/min per dollar) instead of absolute throughput?",
      answer:
        "We believe both aspects are important: Once your app's performance requirements are met, you will want to understand how cost-effective different providers are.",
    },
    {
      question: "Is DBARENA independent?",
      answer:
        "No. While DBARENA is built and sponsored by Supabase, we strive for objective comparisons to make this resource as useful as possible to the database community. We adhere to scientific principles: Our methodology and all test points are available publicly and all the required software is open-source so we can collaborate with the community to improve and extend DBARENA.",
    },
    {
      question: "How can I reproduce your results?",
      answer: "We document the steps to reproduce our results on our methodology page.",
      link: { text: "methodology page", href: `${METHODOLOGY_HREF}#reproduction` },
    },
    {
      question: "What limitations are you aware of?",
      answer: NOT_MEASURED,
      link: { text: "methodology page", href: `${METHODOLOGY_HREF}#limitations` },
    },
  ],
} as const;

/** Authored question for the derived "update cadence" answer. It is kept out
    of `FAQ_COPY.items` because `tests/home-copy-neutrality.test.mjs` checks
    that array as a set of static strings. */
export const CADENCE_QUESTION = "How often are results updated?";

/**
 * The five FAQ items in page order, with the derived cadence answer spliced
 * in between reproducibility and "what is not measured" using the real
 * earliest/latest measured dates from the catalog. `Faq` and `FaqJsonLd` both
 * render this same list, so the accordion and the JSON-LD schema cannot
 * drift from each other.
 */
export function buildFaqItems(data: HomeData): FaqItem[] {
  const [why, independence, reproducibility, notMeasured] = FAQ_COPY.items;
  return [
    why,
    independence,
    reproducibility,
    { question: CADENCE_QUESTION, answer: cadenceAnswer(faqDateRange(data)) },
    notMeasured,
  ];
}
