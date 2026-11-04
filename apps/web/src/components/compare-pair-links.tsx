import Link from "next/link";

import {
  COMPARE_PAIRS,
  comparePairHref,
  comparePairTitle,
  type ComparePair,
} from "@/lib/compare-pairs";
import { textLinkClass } from "@/lib/utils";

/**
 * Plain links to the curated pair pages. Server-rendered, so they are in the
 * HTML without JavaScript; they are also what lets crawlers find the pair
 * pages at all, since each is otherwise only reachable from the sitemap.
 */
export function ComparePairLinks({ current }: { current?: ComparePair }) {
  const pairs = COMPARE_PAIRS.filter((pair) => pair.slug !== current?.slug);
  return (
    <nav aria-labelledby="compare-pair-links" className="compare-pair-links border-t border-border px-page py-8">
      <h2 className="text-[15px] font-medium tracking-tight" id="compare-pair-links">
        {current ? "Other comparisons" : "Popular comparisons"}
      </h2>
      <ul className="mt-3 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
        {pairs.map((pair) => (
          <li key={pair.slug}>
            <Link className={textLinkClass} href={comparePairHref(pair)}>
              {comparePairTitle(pair)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
