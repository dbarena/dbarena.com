import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const PROSE_CLASS = "max-w-[38rem] text-body leading-[1.7] text-foreground/85";

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <code
      className={cn(
        "rounded-sm bg-muted px-1 py-px font-mono text-note tracking-tight text-foreground",
        className,
      )}
    >
      {children}
    </code>
  );
}

export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="max-w-[38rem] overflow-x-auto rounded-md bg-muted px-4 py-3 font-mono text-[13px] leading-relaxed tracking-tight text-foreground">
      <code>{children}</code>
    </pre>
  );
}

export const METHOD_SECTION_SCROLL_MT =
  "scroll-mt-[calc(var(--site-header-h,3rem)+var(--method-jump-h,0px)+1rem)]";

export function MethodSection({
  children,
  id,
  title,
}: {
  children: ReactNode;
  id: string;
  title: string;
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cn(METHOD_SECTION_SCROLL_MT, "border-b border-border py-10 last:border-b-0 lg:py-14")}
      id={id}
    >
      <h2
        className="max-w-[38rem] text-[length:var(--text-section)] leading-[1.2] font-medium tracking-tight"
        id={`${id}-title`}
      >
        {title}
      </h2>
      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </section>
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="max-w-[38rem] pt-2 text-[17px] leading-snug font-medium tracking-tight">
      {children}
    </h3>
  );
}

export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn(PROSE_CLASS, className)}>{children}</p>;
}

export function ProseList({ children }: { children: ReactNode }) {
  return (
    <ul className={cn(PROSE_CLASS, "list-disc space-y-2 pl-5 marker:text-muted-foreground")}>
      {children}
    </ul>
  );
}

export function Callout({
  children,
  label,
  tone = "note",
}: {
  children: ReactNode;
  label: string;
  tone?: "note" | "caveat";
}) {
  const caveat = tone === "caveat";
  return (
    <aside
      className={cn(
        "max-w-[38rem] rounded-md px-4 py-3.5",
        caveat ? "bg-primary/[0.06] dark:bg-primary/10" : "bg-muted/60",
      )}
    >
      <p
        className={cn(
          "text-[12px] font-medium",
          caveat ? "text-primary" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <div className="mt-1.5 space-y-2 text-[14px] leading-relaxed text-foreground/85">
        {children}
      </div>
    </aside>
  );
}
