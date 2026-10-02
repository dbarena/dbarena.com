import Link from "next/link";

import { formatListPrice, formatValue } from "@/lib/format";

import { SwapText } from "./ui/swap-text";

export function MatrixValue({
  href,
  instanceType,
  label,
  leads,
  monthlyUsd,
  name,
  perDollar,
}: {
  href: string;
  /** Omitted by the prototype harness's own copy of this matrix; the
      production chapter always passes it. Shown as a `title` tooltip and in
      the aria-label, not as a third visual line — the trailing "Instance"
      table column (`lg`+) is the sighted-and-unhovered way to read it. */
  instanceType?: string;
  label: string;
  leads: boolean;
  monthlyUsd?: number | null;
  name: string;
  perDollar: number | null;
}) {
  const detail = monthlyUsd !== undefined;
  return (
    <Link
      aria-label={`Compare ${name} at ${label}: ${formatValue(perDollar)} tpm/$${leads ? ", highest at this size" : ""}${detail ? `, ${formatListPrice(monthlyUsd ?? null)} per month` : ""}${instanceType ? `, ${instanceType}` : ""}`}
      className="flex flex-col items-end gap-0.5 py-2"
      href={href}
      title={instanceType}
    >
      <span className="flex flex-wrap items-center justify-end gap-x-2.5 gap-y-1.5">
        {/* A 2px chip marks the leading value at this size, so the highlight
            does not rely on color alone. */}
        {leads ? (
          <span
            aria-hidden="true"
            className="size-[5px] shrink-0 rounded-full bg-[var(--leader-chip)]"
          />
        ) : null}
        <span className="inline-block border-b border-transparent pb-[3px] whitespace-nowrap fine-hover:border-current">
          <SwapText value={formatValue(perDollar)} />
        </span>
      </span>
      {detail ? (
        <span className="font-mono text-note tabular-nums whitespace-nowrap text-muted-foreground">
          <SwapText value={`${formatListPrice(monthlyUsd)}/mo`} />
        </span>
      ) : null}
    </Link>
  );
}
