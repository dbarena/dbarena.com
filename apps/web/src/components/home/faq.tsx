import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { METHODOLOGY_HREF } from "@/lib/site-links";
import { ActionLink } from "@/components/ui/action-link";
import { FaqJsonLd } from "@/components/site-json-ld";
import { cn } from "@/lib/utils";

import { buildFaqItems, FAQ_COPY, type FaqItem } from "./faq-copy";
import type { HomeData } from "./home-data";
import { editorialSectionClass, kickerClass, splitGridClass } from "./home-layout";
import { Panel } from "./ui/panel";

/** Splices `item.link`, when present, into the answer as an inline link. */
function renderFaqAnswer(item: FaqItem) {
  if (!item.link) return item.answer;
  const start = item.answer.indexOf(item.link.text);
  if (start === -1) return item.answer;
  const end = start + item.link.text.length;
  return (
    <>
      {item.answer.slice(0, start)}
      <Link className="underline underline-offset-2 fine-hover:text-foreground" href={item.link.href}>
        {item.link.text}
      </Link>
      {item.answer.slice(end)}
    </>
  );
}

/**
 * Two-column FAQ (26:222).
 *
 * Native `<details>`/`<summary>`: a server component with no client JS, and
 * the answers are in the HTML whether or not scripts run. Open/close and
 * keyboard (Tab, then Enter/Space) come from the browser; the height
 * transition lives in `globals.css` (`.faq-item`) and degrades to an instant
 * toggle where `::details-content` is unsupported.
 *
 * Renders its own `FaqJsonLd` alongside the list — both read the same
 * `buildFaqItems(data)` list, so the visible answers and the JSON-LD schema
 * (including the derived "how often do results update" answer) cannot
 * drift apart.
 */
export function Faq({ data }: { data: HomeData }) {
  const items = buildFaqItems(data);
  return (
    <section aria-labelledby="faq-title" className={editorialSectionClass} id="faq">
      <FaqJsonLd items={items} />
      <div className={splitGridClass}>
        <div>
          <p className={cn(kickerClass, "text-primary uppercase")}>FAQ</p>
          <h2
            className="mt-3 text-[length:var(--text-section)] leading-[var(--text-section--line-height)] font-medium tracking-[-0.035em]"
            id="faq-title"
          >
            {FAQ_COPY.heading}
          </h2>
          <div className="mt-6 max-lg:hidden">
            <ActionLink href={METHODOLOGY_HREF}>Read our benchmark methodology</ActionLink>
          </div>
        </div>

        <Panel as="div" className="home-panel-frost min-w-0">
          <div className="divide-y divide-border">
            {items.map((item) => (
              <details className="faq-item group" key={item.question}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-left text-body font-semibold tracking-[-0.01em] fine-hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown
                    aria-hidden="true"
                    className="shrink-0 text-muted-foreground transition-transform duration-150 ease-exit group-open:rotate-180"
                    size={16}
                  />
                </summary>
                <p className="px-4 pb-4 text-caption leading-[1.7] text-[color:var(--reading-color)]">
                  {renderFaqAnswer(item)}
                </p>
              </details>
            ))}
          </div>
        </Panel>
        <div className="mt-2 lg:hidden">
          <ActionLink href={METHODOLOGY_HREF}>Read the method</ActionLink>
        </div>
      </div>
    </section>
  );
}
