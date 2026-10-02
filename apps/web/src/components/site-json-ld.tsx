import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site-meta";

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "Dataset",
      name: "DBARENA hosted Postgres benchmarks",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      measurementTechnique: "Derived from TPC-C",
      creator: { "@type": "Organization", name: SITE_NAME },
    },
  ],
};

export function SiteJsonLd() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      type="application/ld+json"
    />
  );
}

export type FaqJsonLdItem = { question: string; answer: string };

/**
 * Rendered by the FAQ section itself (`components/home/faq.tsx`), fed the
 * same rendered items it displays — the derived "how often do results
 * update" answer included — so the schema can never drift from what a
 * reader sees. Not rendered anywhere a page carries no FAQ, which is exactly
 * what the schema forbids.
 */
export function FaqJsonLd({ items }: { items: readonly FaqJsonLdItem[] }) {
  const faqGraph = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqGraph) }}
      type="application/ld+json"
    />
  );
}
