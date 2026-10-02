import type { ComponentProps, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PanelTone = "default" | "leader";

/**
 * The structural box a figure sits in: hairline border on `--surface-subtle`
 * (a small same-hue step off the page), with optional corner ticks.
 * `tone="leader"` is the highlighted-card treatment, in cobalt only.
 */
export function Panel({
  as,
  children,
  className,
  ticks = true,
  title,
  tone = "default",
  ...props
}: Omit<ComponentProps<"div">, "title"> & {
  as?: ElementType;
  ticks?: boolean;
  title?: ReactNode;
  tone?: PanelTone;
}) {
  const Component = as ?? "div";
  return (
    <Component
      className={cn(
        "home-panel",
        ticks && "home-panel-ticks",
        tone === "leader" &&
          "bg-[var(--leader-wash)] ring-1 ring-[color-mix(in_oklab,var(--primary)_40%,transparent)]",
        className,
      )}
      {...props}
    >
      {title ? (
        <h3 className="text-body font-semibold tracking-[-0.01em]">{title}</h3>
      ) : null}
      {children}
    </Component>
  );
}
