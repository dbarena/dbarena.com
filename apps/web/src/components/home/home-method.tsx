import { METHODOLOGY_HREF } from "@/lib/site-links";
import { ActionLink } from "@/components/ui/action-link";
import { cn } from "@/lib/utils";
import { BEHIND_RESULTS, NOT_MEASURED, WHY_COPY } from "./home-copy";
import { chapterTitleClass, editorialSectionClass, kickerClass, proseClass, splitGridClass } from "./home-layout";
import { ProtocolRun } from "./protocol-run";

const LIMITATIONS_HREF = `${METHODOLOGY_HREF}#limitations`;

export function HomeMethod() {
  return (
    <section
      aria-labelledby="why-title"
      className={editorialSectionClass}
      id="why"
    >
      <div className={splitGridClass}>
        <div className="self-start md:sticky md:top-[calc(var(--site-header-h)+1.25rem)]">
          <p className={kickerClass}>Behind the results</p>
          <h2 className={chapterTitleClass} id="why-title">Why and how we built these benchmarks</h2>
          <p className="mt-4 max-w-[30rem] text-subhead font-medium text-[color:var(--reading-color)] md:mt-7">
            {WHY_COPY.lead}
          </p>
        </div>
        <div>
          <div className="max-w-[52rem]">
            <span aria-hidden="true" className="mb-5 block h-px w-12 bg-primary" />
            <p className={cn(proseClass, "text-foreground")}>There are plenty of database benchmarks on the Internet but they usually suffer from one or more flaws. Read on to see how our approach differs:</p>
            <dl aria-label="Benchmark flaws and how our approach differs" className="mt-5 divide-y divide-border">
              {BEHIND_RESULTS.map(({ flaw, approach }) => (
                <div className="py-5 first:pt-0 last:pb-0" key={flaw}>
                  <dt className="text-body font-medium">{flaw}</dt>
                  <dd className={cn(proseClass, "mt-1.5")}>{approach}</dd>
                </div>
              ))}
            </dl>
            <ActionLink className="mt-5" href={METHODOLOGY_HREF}>Read the full methodology</ActionLink>
          </div>

          <h3 className="mt-10 text-body font-semibold tracking-[-0.01em]">Our methodology in four steps</h3>
          <div className="mt-4">
            <ProtocolRun />
          </div>

          <h3 className="mt-10 max-w-[52rem] text-body font-semibold tracking-[-0.01em]">
            <a className="fine-hover:text-primary" href={LIMITATIONS_HREF}>Limitations</a>
          </h3>
          <p className="mt-4 max-w-[68ch] text-caption leading-[1.5] text-[color:var(--reading-color)]">{NOT_MEASURED}</p>
        </div>
      </div>
    </section>
  );
}
