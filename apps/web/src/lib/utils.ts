import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Keep our type scale distinct from text colors when merging shared controls.
const merge = extendTailwindMerge({
  extend: { theme: { text: ["2xs", "note", "caption", "body"] } },
});

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}

export const textLinkClass =
  "text-foreground underline decoration-border underline-offset-4 outline-none transition-[text-decoration-color] duration-fast ease-exit focus-visible:ring-2 focus-visible:ring-ring fine-hover:decoration-foreground";

export const primaryLinkClass =
  "text-primary underline-offset-4 outline-none fine-hover:underline focus-visible:ring-2 focus-visible:ring-ring";
