"use client";

import { useMemo } from "react";

import type { BoundType } from "@/lib/catalog";
import { buildNarrative } from "@/lib/compare-narrative";

import type { ResolvedColumn } from "./use-comparison-columns";

/**
 * Plain-language summary of the configurations on screen. It is derived from
 * the same results as the table (see `buildNarrative`), so it follows every
 * change to the columns, sizes, or scenario. Rendered on the server too, so
 * the default state is in the HTML without JavaScript.
 */
export function CompareNarrative({
  boundType,
  columns,
}: {
  boundType: BoundType;
  columns: ResolvedColumn[];
}) {
  const paragraphs = useMemo(() => buildNarrative(columns, boundType), [columns, boundType]);
  if (!paragraphs) return null;

  return (
    <section
      aria-labelledby="compare-narrative-title"
      className="compare-narrative border-t border-border px-page py-8"
    >
      <h2 className="text-[15px] font-medium tracking-tight" id="compare-narrative-title">
        Summary
      </h2>
      <div aria-live="polite" className="mt-3 flex max-w-prose flex-col gap-3 text-[13px] leading-[1.7] text-[color:var(--reading-color)]">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
