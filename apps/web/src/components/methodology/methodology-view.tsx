import type { MethodologyDoc } from "@/lib/methodology-doc";

import { Panel } from "@/components/home/ui/panel";
import { MethodBlocks, MethodProse } from "./method-blocks";
import { MethodJumpNav } from "./method-jump-nav";
import { MethodSection } from "./method-ui";

export function MethodologyView({ doc }: { doc: MethodologyDoc }) {
  return (
    <main className="flex min-h-0 flex-1 flex-col" id="main">
      <section className="border-b border-border px-page pt-10 pb-8 lg:pt-14 lg:pb-12">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:gap-12">
          <div>
            <h1 className="max-w-xl text-[length:var(--text-hero)] leading-[1.08] font-medium tracking-tight">
              {doc.title}
            </h1>
            <MethodProse className="mt-4 max-w-lg" inlines={doc.lede} />
          </div>
          <Panel className="p-5">
            <p className="text-[12px] font-medium text-muted-foreground">
              {doc.protocolKicker}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {doc.protocolFacts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-[12px] text-muted-foreground">{fact.label}</dt>
                  <dd className="mt-0.5 font-mono text-[14px] font-medium tracking-tight">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </section>

      <div className="px-page lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12">
        <MethodJumpNav
          sections={doc.sections.map((section) => ({
            id: section.id,
            label: section.navLabel,
          }))}
        />
        <div className="min-w-0">
          {doc.sections.map((section) => (
            <MethodSection id={section.id} key={section.id} title={section.title}>
              <MethodBlocks blocks={section.blocks} />
            </MethodSection>
          ))}
        </div>
      </div>
    </main>
  );
}
