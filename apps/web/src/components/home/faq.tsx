"use client";

import { Accordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

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
 * Base UI's Accordion carries the aria-expanded wiring and the height
 * transition reads its own --accordion-panel-height variable so nothing here
 * measures in JS. Triggers are reached with Tab: Base UI dropped roving
 * arrow-key focus to follow the ARIA APG update, so arrow keys are
 * intentionally unbound.
 *
 * Renders its own `FaqJsonLd` alongside the accordion — both read the same
 * `buildFaqItems(data)` list, so the visible answers and the JSON-LD schema
 * (including the derived "how often do results update" answer) cannot
 * drift apart.
 */
export function Faq({ data }: { data: HomeData }) {
  const items = useMemo(() => buildFaqItems(data), [data]);
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
          <Accordion.Root className="divide-y divide-border">
            {items.map((item) => (
              <Accordion.Item key={item.question}>
                  <Accordion.Header className="m-0 text-body font-semibold">
                    <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-body font-semibold tracking-[-0.01em] fine-hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                      {item.question}
                      <ChevronDown
                        aria-hidden="true"
                        className="shrink-0 text-muted-foreground transition-transform duration-150 ease-exit group-data-panel-open:rotate-180"
                        size={16}
                      />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel className="group h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-exit data-ending-style:h-0 data-starting-style:h-0">
                    <p className="px-4 pb-4 text-caption leading-[1.7] text-[color:var(--reading-color)] transition-opacity duration-200 ease-exit group-data-starting-style:opacity-0 group-data-ending-style:opacity-0">
                      {renderFaqAnswer(item)}
                    </p>
                  </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </Panel>
        <div className="mt-2 lg:hidden">
          <ActionLink href={METHODOLOGY_HREF}>Read the method</ActionLink>
        </div>
      </div>
    </section>
  );
}
