// On phones the rail is the scroller. Rows must grow with their columns
// (`w-max`) or borders and row fills stop at the viewport while extra
// columns overflow. Desktop lets the document widen instead (`md:w-auto`).
export const COMPARISON_STACK_CLASS =
  "flex min-w-full w-max flex-col md:w-auto";

export const COMPARISON_STUB_CLASS =
  "sticky left-0 z-20 flex w-[6.5rem] shrink-0 flex-col justify-center border-r border-border bg-background px-page py-2.5 md:w-[calc(var(--spacing-page)+9rem)]";

export const COMPARISON_COLUMN_CLASS =
  "flex w-[max(var(--comparison-column-min,8.75rem),calc((100cqi-6.5rem)/2))] min-w-0 shrink-0 snap-start flex-col border-r border-border/60 last:border-r-0 md:w-auto md:min-w-[max(15rem,var(--comparison-column-min,15rem))] md:flex-1 md:basis-0";

export const COMPARISON_CELL_PAD_CLASS = "px-3 md:px-4";

export const COMPARISON_ROW_CLASS =
  "relative flex min-w-full w-max items-stretch md:w-auto";
